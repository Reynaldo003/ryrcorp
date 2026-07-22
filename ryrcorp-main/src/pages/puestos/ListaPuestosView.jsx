import { useState, useEffect } from "react";
import { Search, X, FileText, ChevronDown, ChevronRight, Edit, Eye } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PUESTOS, CATEGORIAS } from "./Datos/PuestosData";
import { obtenerDescriptivo } from "./Datos/descriptivosPuestos";
import { obtenerPuestoCompleto } from "./Datos/puestosCompletos";

const ListaPuestosView = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");
    const [puestoSeleccionado, setPuestoSeleccionado] = useState(null);
    const [puestosFiltrados, setPuestosFiltrados] = useState(PUESTOS);
    const [funcionesExpandidas, setFuncionesExpandidas] = useState({});
    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEditables, setDatosEditables] = useState({
        objetivo: "",
        nivelEstudios: "",
        conocimientos: "",
        experiencia: "",
        habilidades: [],
        funciones: [],
        reportaA: ""
    });
    
    useEffect(() => {
        let filtrados = PUESTOS;
        if (categoriaSeleccionada !== "Todos") {
            filtrados = filtrados.filter(p => p.categoria === categoriaSeleccionada);
        }
        if (searchTerm) {
            filtrados = filtrados.filter(p => 
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setPuestosFiltrados(filtrados);
    }, [searchTerm, categoriaSeleccionada]);
    
    const exportTablaToPDF = () => {
        const doc = new jsPDF('landscape', 'mm', 'a4');
        doc.setFontSize(18);
        doc.setTextColor(19, 30, 92);
        doc.setFont('helvetica', 'bold');
        doc.text('GRUPO AUTOMOTRIZ R&R', 105, 20, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(5, 114, 242);
        doc.text('Lista de Puestos', 105, 32, { align: 'center' });
        doc.setDrawColor(19, 30, 92);
        doc.line(30, 40, 180, 40);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 30, 50);
        doc.text(`Total puestos: ${puestosFiltrados.length}`, 30, 57);
        
        const tableData = puestosFiltrados.map((puesto, idx) => [
            idx + 1, puesto.nombre, puesto.categoria, puesto.dependeDe || '—'
        ]);
        
        autoTable(doc, {
            startY: 68,
            head: [['#', 'Puesto', 'Categoría', 'Depende de']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [19, 30, 92], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 245, 250] },
            columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 85 }, 2: { cellWidth: 40, halign: 'center' }, 3: { cellWidth: 50 } },
            margin: { left: 30, right: 30 }
        });
        doc.save(`Lista_Puestos_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    
   const exportarPuestoAPDF = (puesto, descriptivo, funcionesData) => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    let y = 25;
    
    // Función para verificar espacio y agregar página si es necesario
    const checkPageBreak = (spaceNeeded, keepHeader = true) => {
        if (y + spaceNeeded > pageHeight - 30) {
            doc.addPage();
            y = 25;
            if (keepHeader) {
                agregarEncabezado();
            }
            return true;
        }
        return false;
    };
    
    // Función para agregar encabezado en cada página
    const agregarEncabezado = () => {
        y = 25;
        doc.setFontSize(22);
        doc.setTextColor(19, 30, 92);
        doc.setFont('helvetica', 'bold');
        doc.text('GRUPO AUTOMOTRIZ R&R', pageWidth / 2, y, { align: 'center' });
        y += 10;
        
        doc.setFontSize(14);
        doc.setTextColor(19, 30, 92);
        doc.text('Descriptivo de Puesto', pageWidth / 2, y, { align: 'center' });
        y += 12;
        
        doc.setDrawColor(19, 30, 92);
        doc.setLineWidth(0.5);
        doc.line(20, y, pageWidth - 20, y);
        y += 12;
        
        // Título del puesto
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(descriptivo.titulo || puesto.nombre, 20, y);
        y += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Categoría: ${puesto.categoria}`, 20, y);
        y += 12;
    };
    
    // Agregar encabezado inicial
    agregarEncabezado();
    
    // ========== DATOS GENERALES (TABLA) ==========
    const datosGenerales = [];
    if (puesto.concesionario) datosGenerales.push(['Concesionario', puesto.concesionario]);
    if (puesto.perfilVWAG) datosGenerales.push(['Perfil en VW AG', puesto.perfilVWAG]);
    if (puesto.perfilVWM) datosGenerales.push(['Perfil de VWM (SGP)', puesto.perfilVWM]);
    if (puesto.perfilVolkswagenAcademy) datosGenerales.push(['Perfil Volkswagen Academy', puesto.perfilVolkswagenAcademy]);
    if (puesto.colaboradorActual) datosGenerales.push(['Colaborador actual', puesto.colaboradorActual]);
    if (puesto.fechaInsercion) datosGenerales.push(['Fecha de inserción laboral', puesto.fechaInsercion]);
    
    if (datosGenerales.length > 0) {
        autoTable(doc, {
            startY: y,
            body: datosGenerales,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 4, textColor: [0, 0, 0] },
            columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', textColor: [0, 0, 0] }, 1: { cellWidth: 105, textColor: [0, 0, 0] } },
            margin: { left: 20, right: 20 }
        });
        y = doc.lastAutoTable.finalY + 10;
    }
    
    // ========== OBJETIVO GENERAL ==========
    if (descriptivo.objetivo && descriptivo.objetivo !== "No hay información detallada disponible para este puesto." && descriptivo.objetivo !== "Información no disponible") {
        checkPageBreak(30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Objetivo General', 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const objetivoLines = doc.splitTextToSize(descriptivo.objetivo, 160);
        doc.text(objetivoLines, 25, y);
        y += (objetivoLines.length * 5) + 8;
    }
    
    // ========== NIVEL DE ESTUDIOS ==========
    if (descriptivo.nivelEstudios && descriptivo.nivelEstudios !== "Información no disponible") {
        checkPageBreak(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Nivel de estudios', 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        const estudiosLines = doc.splitTextToSize(descriptivo.nivelEstudios, 160);
        doc.text(estudiosLines, 25, y);
        y += (estudiosLines.length * 5) + 8;
    }
    
    // ========== CONOCIMIENTOS ==========
    if (descriptivo.conocimientos && descriptivo.conocimientos !== "Información no disponible") {
        checkPageBreak(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Conocimientos', 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        const conocLines = doc.splitTextToSize(descriptivo.conocimientos, 160);
        doc.text(conocLines, 25, y);
        y += (conocLines.length * 5) + 8;
    }
    
    // ========== EXPERIENCIA REQUERIDA ==========
    if (descriptivo.experiencia && descriptivo.experiencia !== "Información no disponible") {
        checkPageBreak(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Experiencia requerida', 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        const expLines = doc.splitTextToSize(descriptivo.experiencia, 160);
        doc.text(expLines, 25, y);
        y += (expLines.length * 5) + 8;
    }
    
    // ========== FUNCIONES PRINCIPALES ==========
    if (funcionesData && funcionesData.funciones && funcionesData.funciones.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Funciones principales', 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        for (let idx = 0; idx < funcionesData.funciones.length; idx++) {
            const func = funcionesData.funciones[idx];
            let spaceNeeded = 15;
            if (func.subactividades) {
                spaceNeeded += func.subactividades.length * 5;
            }
            if (y + spaceNeeded > pageHeight - 50) {
                doc.addPage();
                agregarEncabezado();
            }
            
            doc.setFont('helvetica', 'bold');
            doc.text(`${idx + 1}. ${func.nombre}`, 25, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            if (func.subactividades && func.subactividades.length > 0) {
                func.subactividades.forEach(sub => {
                    const subLines = doc.splitTextToSize(`   • ${sub}`, 145);
                    doc.text(subLines, 30, y);
                    y += (subLines.length * 4);
                });
            }
            y += 4;
        }
        y += 5;
    }
    
    // ========== HABILIDADES Y COMPETENCIAS ==========
    if (descriptivo.habilidades && descriptivo.habilidades.length > 0 && descriptivo.habilidades[0] !== "Información no disponible") {
        checkPageBreak(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Habilidades y competencias', 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        descriptivo.habilidades.forEach(habilidad => {
            if (y > pageHeight - 40) {
                doc.addPage();
                agregarEncabezado();
                y = 65;
            }
            doc.text(`• ${habilidad}`, 25, y);
            y += 5;
        });
        y += 5;
    }
    
    // ========== REPORTA A ==========
    if (puesto.dependeDe && puesto.dependeDe !== '—') {
        checkPageBreak(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Reporta a', 20, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(puesto.dependeDe, 25, y);
        y += 15;
    }
    
    // ========== FIRMAS (si hay espacio suficiente) ==========
    const totalPages = doc.internal.getNumberOfPages();
    
    // Verificar si hay espacio para las firmas en la última página
    let espacioParaFirmas = pageHeight - y;
    
    if (espacioParaFirmas < 35) {
        // No hay espacio, crear una nueva página solo para firmas
        doc.addPage();
        y = 25;
        agregarEncabezado();
        espacioParaFirmas = pageHeight - y;
    }
    
    // Posición de las firmas (justo después del contenido o al final de la página)
    let posFirmas = y + 10;
    if (posFirmas > pageHeight - 45) {
        posFirmas = pageHeight - 45;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Pie de página (todas las páginas)
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text('Grupo Automotriz R&R - Documento confidencial', pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.text(`Página ${i} de ${totalPages + (espacioParaFirmas < 35 ? 1 : 0)}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    }
    
    // Dibujar firmas en la última página
    doc.setPage(doc.internal.getNumberOfPages());
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    
    // Línea firma - Gerente RH
    doc.line(35, posFirmas, 85, posFirmas);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('_____________________', 40, posFirmas - 2);
    doc.text('Gerente de Recursos Humanos', 35, posFirmas + 6);
    
    // Línea firma - Director General
    doc.line(120, posFirmas, 170, posFirmas);
    doc.text('_____________________', 125, posFirmas - 2);
    doc.text('Director General', 130, posFirmas + 6);
    
    // Guardar PDF
    doc.save(`Descriptivo_${puesto.nombre.replace(/ /g, '_')}.pdf`);
};
    const toggleFuncion = (idx) => {
        setFuncionesExpandidas(prev => ({ ...prev, [idx]: !prev[idx] }));
    };
 const handleVerDetalles = (puesto) => {

    // Obtener datos completos
    const completo = obtenerPuestoCompleto(puesto.id);

    if (!completo) return;

    // ===== FORMATEAR FUNCIONES =====
    let funcionesFormateadas = [];

    if (Array.isArray(completo.funciones)) {

        funcionesFormateadas = completo.funciones.map((func) => {

            // Si viene como texto
            if (typeof func === "string") {
                return {
                    nombre: func,
                    subactividades: []
                };
            }

            // Si viene como objeto
            return {
                nombre: func.nombre || "Función",
                subactividades: Array.isArray(func.subactividades)
                    ? func.subactividades
                    : []
            };
        });
    }

    // ===== DESCRIPTIVO =====
    const descriptivoParaModal = {
        titulo: completo.nombre,
        objetivo: completo.objetivoGeneral,
        nivelEstudios: completo.nivelEstudios,
        conocimientos: completo.conocimientos || "Información en proceso",
        experiencia: completo.experiencia,
        habilidades: completo.competencias || []
    };

    // ===== SET PUESTO =====
    setPuestoSeleccionado({
        ...completo,
        descriptivo: descriptivoParaModal,
        funciones: {
            funciones: funcionesFormateadas
        },
        categoria: completo.categoria,
        dependeDe: completo.dependeDe || puesto.dependeDe
    });

    // ===== RESET =====
    setModoEdicion(false);
    setFuncionesExpandidas({});

    // ===== DATOS EDITABLES =====
    setDatosEditables({
        objetivo: completo.objetivoGeneral || "",
        nivelEstudios: completo.nivelEstudios || "",
        conocimientos: completo.conocimientos || "",
        experiencia: completo.experiencia || "",
        habilidades: completo.competencias || [],
        funciones: funcionesFormateadas,
        reportaA: completo.dependeDe || puesto.dependeDe || ""
    });
};
    
    const handleGuardarCambios = () => {
        setPuestoSeleccionado({
            ...puestoSeleccionado,
            descriptivo: {
                ...puestoSeleccionado.descriptivo,
                objetivo: datosEditables.objetivo,
                nivelEstudios: datosEditables.nivelEstudios,
                conocimientos: datosEditables.conocimientos,
                experiencia: datosEditables.experiencia,
                habilidades: datosEditables.habilidades
            },
            funciones: {
                funciones: datosEditables.funciones
            },
            dependeDe: datosEditables.reportaA
        });
        setModoEdicion(false);
        alert("Cambios guardados localmente.");
    };
    
    const handleHabilidadChange = (index, value) => {
        const nuevasHabilidades = [...datosEditables.habilidades];
        nuevasHabilidades[index] = value;
        setDatosEditables({ ...datosEditables, habilidades: nuevasHabilidades });
    };
    
    const agregarHabilidad = () => {
        setDatosEditables({
            ...datosEditables,
            habilidades: [...datosEditables.habilidades, ""]
        });
    };
    
    const eliminarHabilidad = (index) => {
        const nuevasHabilidades = datosEditables.habilidades.filter((_, i) => i !== index);
        setDatosEditables({ ...datosEditables, habilidades: nuevasHabilidades });
    };
    
    const handleSubactividadChange = (funcIndex, subIndex, value) => {
        const nuevasFunciones = [...datosEditables.funciones];
        nuevasFunciones[funcIndex].subactividades[subIndex] = value;
        setDatosEditables({ ...datosEditables, funciones: nuevasFunciones });
    };
    
    const agregarSubactividad = (funcIndex) => {
        const nuevasFunciones = [...datosEditables.funciones];
        nuevasFunciones[funcIndex].subactividades.push("");
        setDatosEditables({ ...datosEditables, funciones: nuevasFunciones });
    };
    
    const eliminarSubactividad = (funcIndex, subIndex) => {
        const nuevasFunciones = [...datosEditables.funciones];
        nuevasFunciones[funcIndex].subactividades = nuevasFunciones[funcIndex].subactividades.filter((_, i) => i !== subIndex);
        setDatosEditables({ ...datosEditables, funciones: nuevasFunciones });
    };
    
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Lista de Puestos</h1>
                <p className="text-sm text-gray-500">Gestión y consulta de todos los puestos de la organización</p>
            </div>
            
            {/* Stats - Tarjetas formales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-800">{PUESTOS.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Total puestos</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-800">{CATEGORIAS.length - 1}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Categorías</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-800">{puestosFiltrados.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Mostrando</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-800">{puestosFiltrados.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Con categoría</div>
                </div>
            </div>
            
            {/* Filtros */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre del puesto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={categoriaSeleccionada}
                            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                        >
                            {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={exportTablaToPDF}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                    >
                        <FileText size={18} />
                        Exportar PDF Lista
                    </button>
                </div>
            </div>
            
            {/* Tabla FORMAL con bordes y diseño profesional */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Puesto</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Depende de</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {puestosFiltrados.map((puesto, idx) => (
                                <tr key={puesto.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-3 text-sm text-gray-500">{idx + 1}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-gray-800">{puesto.nombre}</td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{puesto.categoria}</span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{puesto.dependeDe || '—'}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleVerDetalles(puesto)}
                                            className="text-blue-600 hover:text-blue-800 transition"
                                            title="Ver detalles"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* MODAL CON COLORES PASTEL (sin cambios aquí) */}
            {puestoSeleccionado && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="relative w-full max-w-4xl my-8 mx-4 bg-white rounded-2xl shadow-2xl">
                        
                        <div className="relative rounded-t-2xl bg-gradient-to-r from-[#0f2866] to-[#1a3a8a] p-6 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <span className="text-2xl">📋</span> Descriptivo de Puesto
                                    </h2>
                                    <p className="text-white/80 text-sm mt-1">{puestoSeleccionado.descriptivo?.titulo || puestoSeleccionado.nombre}</p>
                                    <p className="text-white/60 text-xs mt-0.5">{puestoSeleccionado.categoria}</p>
                                </div>
                                <div className="flex gap-2">
                                    {!modoEdicion ? (
                                        <button onClick={() => setModoEdicion(true)} className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition">
                                            <Edit className="h-4 w-4" /> Editar
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={handleGuardarCambios} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition">Guardar</button>
                                            <button onClick={() => setModoEdicion(false)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition">Cancelar</button>
                                        </>
                                    )}
                                    <button onClick={() => exportarPuestoAPDF(puestoSeleccionado, puestoSeleccionado.descriptivo, puestoSeleccionado.funciones)} className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition">
                                        <FileText className="h-4 w-4" /> Exportar PDF
                                    </button>
                                    <button onClick={() => setPuestoSeleccionado(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X className="h-5 w-5" /></button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                            
                            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                                <p className="text-sm font-bold text-blue-800">- OBJETIVO DEL PUESTO</p>
                                {modoEdicion ? (
                                    <textarea value={datosEditables.objetivo} onChange={(e) => setDatosEditables({ ...datosEditables, objetivo: e.target.value })} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm" rows="3" />
                                ) : (
                                    <p className="text-gray-700 text-sm mt-1 leading-relaxed">{puestoSeleccionado.descriptivo?.objetivo || 'No disponible'}</p>
                                )}
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                                <p className="text-sm font-bold text-green-800">- NIVEL DE ESTUDIOS</p>
                                {modoEdicion ? (
                                    <input type="text" value={datosEditables.nivelEstudios} onChange={(e) => setDatosEditables({ ...datosEditables, nivelEstudios: e.target.value })} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm" />
                                ) : (
                                    <p className="text-gray-700 text-sm mt-1">{puestoSeleccionado.descriptivo?.nivelEstudios || 'No disponible'}</p>
                                )}
                            </div>
                            
                            {(modoEdicion || (puestoSeleccionado.descriptivo?.conocimientos && puestoSeleccionado.descriptivo.conocimientos !== "Información no disponible")) && (
                                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                                    <p className="text-sm font-bold text-yellow-800">- CONOCIMIENTOS</p>
                                    {modoEdicion ? (
                                        <textarea value={datosEditables.conocimientos} onChange={(e) => setDatosEditables({ ...datosEditables, conocimientos: e.target.value })} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm" rows="3" />
                                    ) : (
                                        <p className="text-gray-700 text-sm mt-1">{puestoSeleccionado.descriptivo?.conocimientos}</p>
                                    )}
                                </div>
                            )}
                            
                            <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
                                <p className="text-sm font-bold text-orange-800">- EXPERIENCIA REQUERIDA</p>
                                {modoEdicion ? (
                                    <textarea value={datosEditables.experiencia} onChange={(e) => setDatosEditables({ ...datosEditables, experiencia: e.target.value })} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm" rows="2" />
                                ) : (
                                    <p className="text-gray-700 text-sm mt-1">{puestoSeleccionado.descriptivo?.experiencia || 'No disponible'}</p>
                                )}
                            </div>
                         {puestoSeleccionado?.funciones?.funciones?.length > 0 && (
                                  <div className="rounded-xl border-l-4 border-purple-400 bg-purple-50 p-4">
                                <p className="text-sm font-bold text-purple-800">
                                    - FUNCIONES PRINCIPALES
                                </p>

                                <div className="mt-4 space-y-4">

                                    {modoEdicion ? (

                                        datosEditables.funciones.map((func, idx) => (
                                            <div
                                                key={`${func.nombre}-${idx}`}
                                                className="overflow-hidden rounded-xl border border-purple-200 bg-white shadow-sm"
                                            >

                                                {/* HEADER */}
                                                <div className="bg-purple-100 p-3">
                                                    <input
                                                        type="text"
                                                        value={func.nombre || ""}
                                                        onChange={(e) => {

                                                            const nuevasFunciones = [...datosEditables.funciones];

                                                            nuevasFunciones[idx].nombre = e.target.value;

                                                            setDatosEditables({
                                                                ...datosEditables,
                                                                funciones: nuevasFunciones
                                                            });

                                                        }}
                                                        className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                                                        placeholder="Nombre de la función"
                                                    />
                                                </div>

                                                {/* SUBACTIVIDADES */}
                                                <div className="border-t border-purple-200 bg-white p-3">

                                                    <p className="mb-2 text-xs font-semibold text-gray-500">
                                                        Subactividades
                                                    </p>

                                                    {func.subactividades?.map((sub, subIdx) => (
                                                        <div
                                                            key={`${idx}-${subIdx}`}
                                                            className="mb-2 flex items-center gap-2"
                                                        >

                                                            <input
                                                                type="text"
                                                                value={sub}
                                                                onChange={(e) =>
                                                                    handleSubactividadChange(
                                                                        idx,
                                                                        subIdx,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="flex-1 rounded-lg border border-gray-300 p-2 text-sm"
                                                            />

                                                            <button
                                                                onClick={() =>
                                                                    eliminarSubactividad(idx, subIdx)
                                                                }
                                                                className="rounded-lg bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
                                                            >
                                                                ✕
                                                            </button>

                                                        </div>
                                                    ))}

                                                    <button
                                                        onClick={() => agregarSubactividad(idx)}
                                                        className="mt-2 text-xs font-medium text-purple-600 hover:text-purple-800"
                                                    >
                                                        + Agregar subactividad
                                                    </button>

                                                </div>
                                            </div>
                                        ))

                                    ) : (

                                        datosEditables.funciones.map((func, idx) => (
                                            <div
                                                key={`${func.nombre}-${idx}`}
                                                className="overflow-hidden rounded-xl border border-purple-200 bg-white shadow-sm"
                                            >

                                                {/* HEADER */}
                                                <button
                                                    onClick={() => toggleFuncion(idx)}
                                                    className="flex w-full items-center justify-between bg-purple-100 px-4 py-3 text-left transition hover:bg-purple-200"
                                                >

                                                    <span className="text-sm font-semibold uppercase tracking-wide text-purple-800">
                                                        {func.nombre}
                                                    </span>

                                                    {funcionesExpandidas[idx] ? (
                                                        <ChevronDown
                                                            className="text-purple-500"
                                                            size={18}
                                                        />
                                                    ) : (
                                                        <ChevronRight
                                                            className="text-purple-500"
                                                            size={18}
                                                        />
                                                    )}

                                                </button>

                                                {/* TABLA */}
                                                {funcionesExpandidas[idx] && (
                                                    <div className="overflow-x-auto border-t border-purple-200">

                                                        <table className="w-full border-collapse">

                                                            <tbody>

                                                                {func.subactividades?.map((sub, subIdx) => (
                                                                    <tr
                                                                        key={`${idx}-${subIdx}`}
                                                                        className="border-b border-gray-200 transition hover:bg-purple-50"
                                                                    >

                                                                        <td className="w-14 px-4 py-3 text-center font-bold text-purple-500">
                                                                            {subIdx + 1}
                                                                        </td>

                                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                                            {sub}
                                                                        </td>

                                                                    </tr>
                                                                ))}

                                                            </tbody>

                                                        </table>

                                                    </div>
                                                )}

                                            </div>
                                        ))

                                    )}

                                </div>
                            </div>
                            )}
                            
                            <div className="bg-pink-50 rounded-lg p-4 border-l-4 border-pink-400">
                                <p className="text-sm font-bold text-pink-800">- HABILIDADES Y COMPETENCIAS</p>
                                {modoEdicion ? (
                                    <div className="mt-1 space-y-2">
                                        {datosEditables.habilidades.map((hab, idx) => (
                                            <div key={idx} className="flex gap-2"><input type="text" value={hab} onChange={(e) => handleHabilidadChange(idx, e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg text-sm" /><button onClick={() => eliminarHabilidad(idx)} className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs">✕</button></div>
                                        ))}
                                        <button onClick={agregarHabilidad} className="text-xs text-pink-600 hover:text-pink-700">+ Agregar habilidad</button>
                                    </div>
                                ) : (
                                    <ul className="mt-1 space-y-1">
                                        {puestoSeleccionado.descriptivo?.habilidades && puestoSeleccionado.descriptivo.habilidades.length > 0 && puestoSeleccionado.descriptivo.habilidades[0] !== "Información no disponible" ? (
                                            puestoSeleccionado.descriptivo.habilidades.map((hab, idx) => (<li key={idx} className="text-sm text-gray-700 flex items-start gap-2"><span className="text-pink-400">-</span><span>{hab}</span></li>))
                                        ) : (
                                            <p className="text-gray-700 text-sm">No disponible</p>
                                        )}
                                    </ul>
                                )}
                            </div>
                            
                            <div className="bg-slate-100 rounded-lg p-4 border-l-4 border-slate-400">
                                <p className="text-sm font-bold text-slate-700">- REPORTA A</p>
                                {modoEdicion ? (
                                    <input type="text" value={datosEditables.reportaA} onChange={(e) => setDatosEditables({ ...datosEditables, reportaA: e.target.value })} className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm" />
                                ) : (
                                    <p className="text-gray-700 text-sm mt-1">{puestoSeleccionado.dependeDe || '—'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaPuestosView;