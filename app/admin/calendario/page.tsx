'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Client {
    name: string;
    phone: string;
    email: string;
    location: string;
}

interface ServicePuntual {
    id: string;
    created_at: string;
    client_id: string;
    clients: Client;
    make_model: string;
    year: string;
    damage_type: string;
    status: string;
    scheduled_date: string | null;
    description?: string;
}

interface CalendarEvent {
    id: string;
    created_at: string;
    title: string;
    description: string | null;
    event_date: string;
    end_date: string | null;
    event_type: string;
    color: string;
    service_puntual_id: string | null;
    client_id: string | null;
    is_completed: boolean;
    notes: string | null;
    // Joined data
    service_puntual?: ServicePuntual;
}

// Combined type for calendar display
interface CalendarItem {
    id: string;
    type: 'appointment' | 'event';
    title: string;
    date: Date;
    color: string;
    clientName?: string;
    clientPhone?: string;
    vehicle?: string;
    description?: string;
    serviceId?: string;
    eventId?: string;
    isCompleted?: boolean;
}

export default function CalendarioPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<ServicePuntual[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);

    // Modal states
    const [showEventModal, setShowEventModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // New event form
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '09:00',
        end_date: '',
        end_time: '',
        event_type: 'general',
        color: '#D4AF37',
        notes: ''
    });

    const [savingEvent, setSavingEvent] = useState(false);

    const eventColors = [
        { value: '#D4AF37', name: 'Dorado' },
        { value: '#4CAF50', name: 'Verde' },
        { value: '#2196F3', name: 'Azul' },
        { value: '#FF5722', name: 'Naranja' },
        { value: '#9C27B0', name: 'Púrpura' },
        { value: '#E91E63', name: 'Rosa' },
        { value: '#00BCD4', name: 'Cyan' },
        { value: '#FF9800', name: 'Ámbar' },
    ];

    const eventTypes = [
        { value: 'general', name: 'General' },
        { value: 'recordatorio', name: 'Recordatorio' },
        { value: 'reunion', name: 'Reunión' },
        { value: 'personal', name: 'Personal' },
        { value: 'otro', name: 'Otro' }
    ];

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchCalendarData();
        }
    }, []);

    useEffect(() => {
        // Combine appointments and events into calendar items
        const items: CalendarItem[] = [];

        appointments.forEach(apt => {
            if (apt.scheduled_date) {
                items.push({
                    id: apt.id,
                    type: 'appointment',
                    title: `Turno: ${apt.clients?.name || 'Cliente'}`,
                    date: new Date(apt.scheduled_date),
                    color: '#4CAF50', // Green for appointments
                    clientName: apt.clients?.name,
                    clientPhone: apt.clients?.phone,
                    vehicle: `${apt.make_model} ${apt.year}`,
                    description: apt.description,
                    serviceId: apt.id
                });
            }
        });

        events.forEach(evt => {
            items.push({
                id: evt.id,
                type: 'event',
                title: evt.title,
                date: new Date(evt.event_date),
                color: evt.color || '#D4AF37',
                description: evt.description || '',
                eventId: evt.id,
                isCompleted: evt.is_completed,
                clientName: evt.service_puntual?.clients?.name
            });
        });

        setCalendarItems(items);
    }, [appointments, events]);

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            // Fetch scheduled appointments from service_puntual
            const { data: aptData, error: aptError } = await supabase
                .from('service_puntual')
                .select(`
                    *,
                    clients (name, phone, email, location)
                `)
                .eq('status', 'Turno Agendado')
                .not('scheduled_date', 'is', null)
                .order('scheduled_date', { ascending: true });

            if (aptError) throw aptError;
            setAppointments(aptData || []);

            // Fetch calendar events
            const { data: evtData, error: evtError } = await supabase
                .from('calendar_events')
                .select(`
                    *,
                    service_puntual (
                        id,
                        make_model,
                        year,
                        clients (name, phone)
                    )
                `)
                .order('event_date', { ascending: true });

            if (evtError) throw evtError;
            setEvents(evtData || []);

        } catch (error) {
            console.error('Error fetching calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '111355') {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'true');
            fetchCalendarData();
        } else {
            alert('Contraseña incorrecta');
        }
    };

    // Calendar navigation
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get calendar grid data
    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = lastDay.getDate();

        const days: (Date | null)[] = [];

        // Add empty slots for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    // Get items for a specific day
    const getItemsForDay = (date: Date): CalendarItem[] => {
        return calendarItems.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.toDateString() === date.toDateString();
        });
    };

    // Handle day click
    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        const dayItems = getItemsForDay(date);
        if (dayItems.length === 1) {
            setSelectedItem(dayItems[0]);
            setShowDetailModal(true);
        } else if (dayItems.length > 1) {
            // Show list of items for that day
            setShowDetailModal(true);
        }
    };

    // Handle item click
    const handleItemClick = (item: CalendarItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItem(item);
        setSelectedDate(item.date);
        setShowDetailModal(true);
    };

    // Open new event modal
    const openNewEventModal = (date?: Date) => {
        const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setNewEvent({
            title: '',
            description: '',
            event_date: dateStr,
            event_time: '09:00',
            end_date: '',
            end_time: '',
            event_type: 'general',
            color: '#D4AF37',
            notes: ''
        });
        setShowEventModal(true);
    };

    // Save new event
    const handleSaveEvent = async () => {
        if (!newEvent.title || !newEvent.event_date) {
            alert('El título y la fecha son obligatorios');
            return;
        }

        setSavingEvent(true);
        try {
            const eventDateTime = new Date(`${newEvent.event_date}T${newEvent.event_time}:00`);
            let endDateTime = null;
            if (newEvent.end_date && newEvent.end_time) {
                endDateTime = new Date(`${newEvent.end_date}T${newEvent.end_time}:00`);
            }

            const { data, error } = await supabase
                .from('calendar_events')
                .insert([{
                    title: newEvent.title,
                    description: newEvent.description,
                    event_date: eventDateTime.toISOString(),
                    end_date: endDateTime ? endDateTime.toISOString() : null,
                    event_type: newEvent.event_type,
                    color: newEvent.color,
                    notes: newEvent.notes
                }])
                .select();

            if (error) throw error;

            alert('Evento creado exitosamente');
            setShowEventModal(false);
            fetchCalendarData();

        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error al guardar el evento');
        } finally {
            setSavingEvent(false);
        }
    };

    // Delete event
    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            alert('Evento eliminado');
            setShowDetailModal(false);
            setSelectedItem(null);
            fetchCalendarData();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Error al eliminar el evento');
        }
    };

    // Toggle event completion
    const handleToggleComplete = async (eventId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('calendar_events')
                .update({ is_completed: !currentStatus })
                .eq('id', eventId);

            if (error) throw error;
            fetchCalendarData();
        } catch (error) {
            console.error('Error updating event:', error);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    if (!isAuthenticated) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#111',
                color: '#fff'
            }}>
                <form onSubmit={handleLogin} style={{
                    padding: '2rem',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    textAlign: 'center',
                    background: '#1a1a1a'
                }}>
                    <h2 style={{ marginBottom: '1.5rem', color: '#D4AF37' }}>Calendario Admin</h2>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '10px',
                            marginBottom: '1rem',
                            width: '100%',
                            borderRadius: '5px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff'
                        }}
                    />
                    <button type="submit" className="btn-gold" style={{ width: '100%' }}>Ingresar</button>
                </form>
            </div>
        );
    }

    const today = new Date();
    const calendarDays = getCalendarDays();

    return (
        <div style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '20px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Link href="/admin" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '1.2rem' }}>
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 style={{ color: '#D4AF37', margin: 0, fontSize: '1.5rem' }}>
                            <i className="fas fa-calendar-alt" style={{ marginRight: '10px' }}></i>
                            Calendario de Turnos
                        </h1>
                    </div>
                    <button
                        onClick={() => openNewEventModal()}
                        className="btn-gold"
                        style={{ padding: '10px 20px' }}
                    >
                        <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                        Nuevo Evento
                    </button>
                </header>

                {/* Calendar Navigation */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    background: '#1a1a1a',
                    padding: '15px 20px',
                    borderRadius: '10px',
                    border: '1px solid #333'
                }}>
                    <button
                        onClick={goToPreviousMonth}
                        style={{
                            background: '#333',
                            border: 'none',
                            color: '#fff',
                            padding: '10px 15px',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ margin: 0, color: '#D4AF37', fontSize: '1.3rem' }}>
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button
                            onClick={goToToday}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                cursor: 'pointer',
                                marginTop: '5px',
                                fontSize: '0.85rem'
                            }}
                        >
                            Ir a Hoy
                        </button>
                    </div>

                    <button
                        onClick={goToNextMonth}
                        style={{
                            background: '#333',
                            border: 'none',
                            color: '#fff',
                            padding: '10px 15px',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <p style={{ color: '#888' }}>Cargando calendario...</p>
                    </div>
                ) : (
                    <>
                        {/* Calendar Grid */}
                        <div style={{
                            background: '#1a1a1a',
                            borderRadius: '10px',
                            border: '1px solid #333',
                            overflow: 'hidden'
                        }}>
                            {/* Day Headers */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                borderBottom: '1px solid #333'
                            }}>
                                {dayNames.map(day => (
                                    <div
                                        key={day}
                                        style={{
                                            padding: '15px 10px',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            color: '#D4AF37',
                                            background: '#252525'
                                        }}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)'
                            }}>
                                {calendarDays.map((date, index) => {
                                    if (!date) {
                                        return (
                                            <div
                                                key={`empty-${index}`}
                                                style={{
                                                    minHeight: '120px',
                                                    background: '#151515',
                                                    borderRight: '1px solid #333',
                                                    borderBottom: '1px solid #333'
                                                }}
                                            />
                                        );
                                    }

                                    const isToday = date.toDateString() === today.toDateString();
                                    const dayItems = getItemsForDay(date);

                                    return (
                                        <div
                                            key={date.toISOString()}
                                            onClick={() => handleDayClick(date)}
                                            style={{
                                                minHeight: '120px',
                                                padding: '8px',
                                                background: isToday ? 'rgba(212, 175, 55, 0.1)' : '#1a1a1a',
                                                borderRight: '1px solid #333',
                                                borderBottom: '1px solid #333',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isToday) e.currentTarget.style.background = '#252525';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isToday) e.currentTarget.style.background = '#1a1a1a';
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '5px'
                                            }}>
                                                <span style={{
                                                    fontWeight: isToday ? 'bold' : 'normal',
                                                    background: isToday ? '#D4AF37' : 'transparent',
                                                    color: isToday ? '#000' : '#fff',
                                                    borderRadius: '50%',
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {date.getDate()}
                                                </span>
                                                {dayItems.length > 0 && (
                                                    <span style={{
                                                        background: '#333',
                                                        color: '#D4AF37',
                                                        padding: '2px 6px',
                                                        borderRadius: '10px',
                                                        fontSize: '0.7rem'
                                                    }}>
                                                        {dayItems.length}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Events for this day */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                {dayItems.slice(0, 3).map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={(e) => handleItemClick(item, e)}
                                                        style={{
                                                            background: item.color,
                                                            color: '#000',
                                                            padding: '3px 6px',
                                                            borderRadius: '3px',
                                                            fontSize: '0.7rem',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            opacity: item.isCompleted ? 0.6 : 1,
                                                            textDecoration: item.isCompleted ? 'line-through' : 'none'
                                                        }}
                                                    >
                                                        {formatTime(item.date)} - {item.title}
                                                    </div>
                                                ))}
                                                {dayItems.length > 3 && (
                                                    <div style={{
                                                        color: '#888',
                                                        fontSize: '0.7rem',
                                                        textAlign: 'center'
                                                    }}>
                                                        +{dayItems.length - 3} más
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Upcoming Events List */}
                        <div style={{
                            marginTop: '30px',
                            background: '#1a1a1a',
                            borderRadius: '10px',
                            border: '1px solid #333',
                            padding: '20px'
                        }}>
                            <h3 style={{ color: '#D4AF37', marginTop: 0, marginBottom: '15px' }}>
                                <i className="fas fa-clock" style={{ marginRight: '10px' }}></i>
                                Próximos Turnos y Eventos
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {calendarItems
                                    .filter(item => new Date(item.date) >= new Date())
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .slice(0, 10)
                                    .map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setSelectedDate(item.date);
                                                setShowDetailModal(true);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                padding: '12px 15px',
                                                background: '#252525',
                                                borderRadius: '8px',
                                                borderLeft: `4px solid ${item.color}`,
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#252525'}
                                        >
                                            <div style={{
                                                background: item.color,
                                                color: '#000',
                                                padding: '8px 12px',
                                                borderRadius: '5px',
                                                textAlign: 'center',
                                                minWidth: '60px'
                                            }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {item.date.getDate()}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                                    {monthNames[item.date.getMonth()].slice(0, 3)}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '3px' }}>
                                                    {item.title}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    <i className="fas fa-clock" style={{ marginRight: '5px' }}></i>
                                                    {formatTime(item.date)}
                                                    {item.clientName && (
                                                        <span style={{ marginLeft: '15px' }}>
                                                            <i className="fas fa-user" style={{ marginRight: '5px' }}></i>
                                                            {item.clientName}
                                                        </span>
                                                    )}
                                                    {item.vehicle && (
                                                        <span style={{ marginLeft: '15px' }}>
                                                            <i className="fas fa-car" style={{ marginRight: '5px' }}></i>
                                                            {item.vehicle}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                {item.type === 'appointment' ? (
                                                    <span style={{
                                                        background: '#4CAF50',
                                                        color: '#fff',
                                                        padding: '4px 10px',
                                                        borderRadius: '15px',
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        Turno
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        background: '#333',
                                                        color: '#D4AF37',
                                                        padding: '4px 10px',
                                                        borderRadius: '15px',
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        Evento
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                {calendarItems.filter(item => new Date(item.date) >= new Date()).length === 0 && (
                                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                                        No hay turnos ni eventos próximos
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* New Event Modal */}
            {showEventModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                    onClick={() => setShowEventModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            width: '500px',
                            maxWidth: '95%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            borderRadius: '10px',
                            border: '1px solid #333',
                            padding: '25px',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowEventModal(false)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                fontSize: '1.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            &times;
                        </button>

                        <h2 style={{ color: '#D4AF37', marginBottom: '20px', marginTop: 0 }}>
                            <i className="fas fa-calendar-plus" style={{ marginRight: '10px' }}></i>
                            Nuevo Evento
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Título *</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="Ej: Reunión con proveedor"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '1px solid #444',
                                        background: '#222',
                                        color: '#fff'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Fecha *</label>
                                    <input
                                        type="date"
                                        value={newEvent.event_date}
                                        onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Hora</label>
                                    <input
                                        type="time"
                                        value={newEvent.event_time}
                                        onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Tipo</label>
                                    <select
                                        value={newEvent.event_type}
                                        onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff'
                                        }}
                                    >
                                        {eventTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Color</label>
                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                        {eventColors.map(color => (
                                            <div
                                                key={color.value}
                                                onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    background: color.value,
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    border: newEvent.color === color.value ? '3px solid #fff' : '2px solid transparent'
                                                }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Descripción</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Detalles del evento..."
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '1px solid #444',
                                        background: '#222',
                                        color: '#fff',
                                        minHeight: '80px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleSaveEvent}
                                disabled={savingEvent}
                                className="btn-gold"
                                style={{ width: '100%', padding: '12px', marginTop: '10px' }}
                            >
                                {savingEvent ? 'Guardando...' : 'Crear Evento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                    onClick={() => {
                        setShowDetailModal(false);
                        setSelectedItem(null);
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            width: '500px',
                            maxWidth: '95%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            borderRadius: '10px',
                            border: '1px solid #333',
                            padding: '25px',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setShowDetailModal(false);
                                setSelectedItem(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                fontSize: '1.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            &times;
                        </button>

                        {selectedItem ? (
                            <>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{
                                        width: '12px',
                                        height: '40px',
                                        background: selectedItem.color,
                                        borderRadius: '3px'
                                    }} />
                                    <div>
                                        <h2 style={{ color: '#fff', margin: 0 }}>{selectedItem.title}</h2>
                                        <p style={{ color: '#888', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                            {formatDate(selectedItem.date)} - {formatTime(selectedItem.date)}
                                        </p>
                                    </div>
                                </div>

                                {selectedItem.type === 'appointment' && (
                                    <div style={{
                                        background: '#252525',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '15px'
                                    }}>
                                        <h4 style={{ color: '#D4AF37', marginTop: 0, marginBottom: '10px' }}>
                                            <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
                                            Información del Cliente
                                        </h4>
                                        <p style={{ margin: '5px 0', color: '#fff' }}>
                                            <strong>Nombre:</strong> {selectedItem.clientName}
                                        </p>
                                        {selectedItem.clientPhone && (
                                            <p style={{ margin: '5px 0', color: '#fff' }}>
                                                <strong>Teléfono:</strong>{' '}
                                                <a
                                                    href={`tel:${selectedItem.clientPhone}`}
                                                    style={{ color: '#4CAF50' }}
                                                >
                                                    {selectedItem.clientPhone}
                                                </a>
                                            </p>
                                        )}
                                        {selectedItem.vehicle && (
                                            <p style={{ margin: '5px 0', color: '#fff' }}>
                                                <strong>Vehículo:</strong> {selectedItem.vehicle}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {selectedItem.description && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <h4 style={{ color: '#aaa', marginBottom: '5px' }}>Descripción</h4>
                                        <p style={{ color: '#fff', background: '#252525', padding: '10px', borderRadius: '5px' }}>
                                            {selectedItem.description}
                                        </p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    {selectedItem.type === 'appointment' && selectedItem.serviceId && (
                                        <Link
                                            href={`/admin/puntual?id=${selectedItem.serviceId}`}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                background: '#4CAF50',
                                                color: '#fff',
                                                textAlign: 'center',
                                                borderRadius: '5px',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <i className="fas fa-eye" style={{ marginRight: '8px' }}></i>
                                            Ver Solicitud
                                        </Link>
                                    )}

                                    {selectedItem.type === 'event' && selectedItem.eventId && (
                                        <>
                                            <button
                                                onClick={() => handleToggleComplete(selectedItem.eventId!, selectedItem.isCompleted || false)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    background: selectedItem.isCompleted ? '#666' : '#4CAF50',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <i className={`fas ${selectedItem.isCompleted ? 'fa-undo' : 'fa-check'}`} style={{ marginRight: '8px' }}></i>
                                                {selectedItem.isCompleted ? 'Desmarcar' : 'Completar'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEvent(selectedItem.eventId!)}
                                                style={{
                                                    padding: '10px 15px',
                                                    background: '#ff4444',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : selectedDate ? (
                            <>
                                <h2 style={{ color: '#D4AF37', marginTop: 0, marginBottom: '20px' }}>
                                    {formatDate(selectedDate)}
                                </h2>

                                {getItemsForDay(selectedDate).length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {getItemsForDay(selectedDate).map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItem(item)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '12px',
                                                    background: '#252525',
                                                    borderRadius: '8px',
                                                    borderLeft: `4px solid ${item.color}`,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{item.title}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                                        {formatTime(item.date)}
                                                    </div>
                                                </div>
                                                <i className="fas fa-chevron-right" style={{ color: '#666' }}></i>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', textAlign: 'center' }}>
                                        No hay eventos para este día
                                    </p>
                                )}

                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        openNewEventModal(selectedDate);
                                    }}
                                    className="btn-gold"
                                    style={{ width: '100%', padding: '12px', marginTop: '20px' }}
                                >
                                    <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                                    Agregar Evento
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
