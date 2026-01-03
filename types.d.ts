declare module 'jspdf-autotable' {
    import { jsPDF } from 'jspdf';

    interface AutoTableOptions {
        startY?: number;
        head?: any[][];
        body?: any[][];
        foot?: any[][];
        theme?: string;
        styles?: any;
        headStyles?: any;
        bodyStyles?: any;
        footStyles?: any;
        margin?: any;
        didDrawPage?: (data: any) => void;
    }

    export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
