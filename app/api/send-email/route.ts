import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { subject, html, to } = await request.json();

        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (!user || !pass) {
            console.error('Missing EMAIL_USER or EMAIL_PASS environment variables');
            return NextResponse.json(
                { error: 'Server configuration error: Missing email credentials.' },
                { status: 500 }
            );
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass, // Must be an App Password for Gmail
            },
        });

        const mailOptions = {
            from: `DSP-MDS Notificaciones <${user}>`,
            to: 'Dspmds.arg@gmail.com', // Enviar siempre a esta dirección
            subject: subject || 'Nueva notificación desde la web',
            html: html || '<p>Sin contenido.</p>',
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: 'Failed to send email: ' + error.message }, { status: 500 });
    }
}
