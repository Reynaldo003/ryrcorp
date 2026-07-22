// PDFProfesional.jsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Configuración de colores de la empresa
const COLOR_PRIMARIO = [19, 30, 92]; // Azul R&R
const COLOR_SECUNDARIO = [5, 114, 242]; // Azul claro
const COLOR_GRIS = [100, 100, 100];
const COLOR_BORDE = [220, 220, 220];

// Función para agregar encabezado
const agregarEncabezado = (doc, titulo, subtitulo = '') => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Logo/texto principal
    doc.setFontSize(20);
    doc.setTextColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('GRUPO AUTOMOTRIZ R&R', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo
    if (subtitulo) {
        doc.setFontSize(11);
        doc.setTextColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
        doc.text(subtitulo, pageWidth / 2, 30, { align: 'center' });
    }
    
    // Título del documento
    doc.setFontSize(16);
    doc.setTextColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
    doc.text(titulo, pageWidth / 2, 40, { align: 'center' });
    
    // Línea decorativa
    doc.setDrawColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
    doc.setLineWidth(0.5);
    doc.line(30, 45, pageWidth - 30, 45);
    
    // Fecha y metadatos
    doc.setFontSize(9);
    doc.setTextColor(COLOR_GRIS[0], COLOR_GRIS[1], COLOR_GRIS[2]);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-MX')}`, 20, 55);
    
    return 62; // Y position después del encabezado
};

// Función para agregar pie de página con firma
const agregarPieDePagina = (doc, paginaActual, totalPaginas, incluirFirma = true) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Línea separadora
    doc.setDrawColor(COLOR_BORDE[0], COLOR_BORDE[1], COLOR_BORDE[2]);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    // Texto de confidencialidad
    doc.setFontSize(8);
    doc.setTextColor(COLOR_GRIS[0], COLOR_GRIS[1], COLOR_GRIS[2]);
    doc.text('Documento Confidencial - Propiedad de Grupo Automotriz R&R', pageWidth / 2, pageHeight - 18, { align: 'center' });
    
    // Número de página
    doc.text(`Página ${paginaActual} de ${totalPaginas}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    
    // FIRMA (solo en la última página)
    if (incluirFirma && paginaActual === totalPaginas) {
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        // Línea de firma
        doc.setDrawColor(0, 0, 0);
        doc.line(40, pageHeight - 55, 90, pageHeight - 55);
        doc.text('_____________________', 45, pageHeight - 57);
        doc.text('Gerente de Recursos Humanos', 45, pageHeight - 48);
        
        doc.line(120, pageHeight - 55, 170, pageHeight - 55);
        doc.text('_____________________', 125, pageHeight - 57);
        doc.text('Director General', 135, pageHeight - 48);
        
        // Sello (simulado con texto)
        doc.setFontSize(7);
        doc.setTextColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
        doc.text('SELLO DE LA EMPRESA', pageWidth / 2, pageHeight - 40, { align: 'center' });
        doc.setDrawColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
        doc.circle(pageWidth / 2, pageHeight - 38, 15);
    }
};

// Función principal para generar PDF completo
export const generarPDFCompleto = (puestos, titulo = 'Descripción de Puestos') => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    let yPosition = 0;
    
    // Agregar encabezado
    yPosition = agregarEncabezado(doc, titulo, 'Documento de Descripción de Puestos');
    
    // Recorrer cada puesto
    puestos.forEach((puesto, index) => {
        // Verificar espacio en página
        if (yPosition > 240) {
            doc.addPage();
            yPosition = agregarEncabezado(doc, titulo, 'Documento de Descripción de Puestos');
        }
        
        // === NOMBRE DEL PUESTO ===
        doc.setFontSize(14);
        doc.setTextColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${puesto.nombre || 'No especificado'}`, 20, yPosition);
        yPosition += 8;
        
        // Categoría
        doc.setFontSize(9);
        doc.setTextColor(COLOR_GRIS[0], COLOR_GRIS[1], COLOR_GRIS[2]);
        doc.setFont('helvetica', 'italic');
        doc.text(`Categoría: ${puesto.categoria || 'No especificada'}`, 25, yPosition);
        yPosition += 8;
        
        // === OBJETIVO GENERAL ===
        if (puesto.objetivoGeneral) {
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text('OBJETIVO GENERAL:', 20, yPosition);
            yPosition += 5;
            
            doc.setFont('helvetica', 'normal');
            const objetivoLines = doc.splitTextToSize(puesto.objetivoGeneral, 165);
            doc.text(objetivoLines, 25, yPosition);
            yPosition += (objetivoLines.length * 5) + 5;
        }
        
        // === PERFILES (si existen) ===
        if (puesto.perfilVWAG || puesto.perfilVWM) {
            if (yPosition > 230) {
                doc.addPage();
                yPosition = agregarEncabezado(doc, titulo, 'Documento de Descripción de Puestos');
            }
            
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('PERFILES INSTITUCIONALES:', 20, yPosition);
            yPosition += 5;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            
            if (puesto.perfilVWAG) {
                doc.text(`• VW AG: ${puesto.perfilVWAG}`, 25, yPosition);
                yPosition += 5;
            }
            if (puesto.perfilVWM) {
                doc.text(`• VWM (SGP): ${puesto.perfilVWM}`, 25, yPosition);
                yPosition += 5;
            }
            if (puesto.perfilVolkswagenAcademy) {
                const academyLines = doc.splitTextToSize(`• Volkswagen Academy: ${puesto.perfilVolkswagenAcademy}`, 160);
                doc.text(academyLines, 25, yPosition);
                yPosition += (academyLines.length * 5) + 5;
            }
        }
        
        // === COLABORADOR ACTUAL ===
        if (puesto.colaboradorActual) {
            doc.setFont('helvetica', 'bold');
            doc.text('COLABORADOR ACTUAL:', 20, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            doc.text(puesto.colaboradorActual, 25, yPosition);
            yPosition += 8;
        }
        
        // === FECHA INSERCIÓN ===
        if (puesto.fechaInsercion) {
            doc.text(`Fecha de inserción laboral: ${puesto.fechaInsercion}`, 25, yPosition);
            yPosition += 6;
        }
        
        // === NIVEL DE ESTUDIOS ===
        if (puesto.nivelEstudios) {
            if (yPosition > 230) {
                doc.addPage();
                yPosition = agregarEncabezado(doc, titulo, 'Documento de Descripción de Puestos');
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text('NIVEL DE ESTUDIOS:', 20, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            const estudiosLines = doc.splitTextToSize(puesto.nivelEstudios, 165);
            doc.text(estudiosLines, 25, yPosition);
            yPosition += (estudiosLines.length * 5) + 5;
        }
        
        // === EXPERIENCIA ===
        if (puesto.experiencia) {
            doc.setFont('helvetica', 'bold');
            doc.text('EXPERIENCIA REQUERIDA:', 20, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            const expLines = doc.splitTextToSize(puesto.experiencia, 165);
            doc.text(expLines, 25, yPosition);
            yPosition += (expLines.length * 5) + 5;
        }
        
        // === FUNCIONES PRINCIPALES (tabla) ===
        if (puesto.funciones && puesto.funciones.length > 0) {
            if (yPosition > 210) {
                doc.addPage();
                yPosition = agregarEncabezado(doc, titulo, 'Documento de Descripción de Puestos');
            }
            
            // Usar autoTable para mejor formato
            const funcionesData = puesto.funciones.map((funcion, idx) => [
                (idx + 1).toString(),
                funcion.length > 100 ? funcion.substring(0, 100) + '...' : funcion
            ]);
            
            autoTable(doc, {
                startY: yPosition,
                head: [['#', 'FUNCIÓN PRINCIPAL']],
                body: funcionesData,
                theme: 'striped',
                headStyles: { 
                    fillColor: COLOR_PRIMARIO, 
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                bodyStyles: { fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 155 }
                },
                margin: { left: 20 },
                didDrawPage: () => {}
            });
            
            yPosition = doc.lastAutoTable.finalY + 5;
        }
        
        // === COMPETENCIAS ===
        if (puesto.competencias && puesto.competencias.length > 0) {
            if (yPosition > 230) {
                doc.addPage();
                yPosition = agregarEncabezado(doc, titulo, 'Documento de Descripción de Puestos');
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text('COMPETENCIAS CLAVE:', 20, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            
            const competenciasText = puesto.competencias.map(comp => `• ${comp}`).join('\n');
            const compLines = doc.splitTextToSize(competenciasText, 165);
            doc.text(compLines, 25, yPosition);
            yPosition += (compLines.length * 5) + 5;
        }
        
        // === INDICADORES ===
        if (puesto.indicadores && puesto.indicadores.length > 0) {
            if (yPosition > 230) {
                doc.addPage();
                yPosition = agregarEncabezado(doc, titulo, 'Documento de Descripción de Puestos');
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text('INDICADORES DE DESEMPEÑO:', 20, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            
            const indicadoresText = puesto.indicadores.map(ind => `• ${ind}`).join('\n');
            const indLines = doc.splitTextToSize(indicadoresText, 165);
            doc.text(indLines, 25, yPosition);
            yPosition += (indLines.length * 5) + 10;
        }
        
        // Separador entre puestos
        doc.setDrawColor(COLOR_BORDE[0], COLOR_BORDE[1], COLOR_BORDE[2]);
        doc.line(20, yPosition - 5, 190, yPosition - 5);
    });
    
    // Agregar pie de página con firmas
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        agregarPieDePagina(doc, i, totalPaginas, true);
    }
    
    // Guardar PDF
    doc.save(`R&R_${titulo.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Función para exportar un puesto específico
export const generarPDFPuestoUnico = (puesto) => {
    generarPDFCompleto([puesto], `Puesto_${puesto.nombre.replace(/ /g, '_')}`);
};