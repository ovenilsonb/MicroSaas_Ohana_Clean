import React, { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { ReportTemplateConfig, ReportAssignments } from '../types';
import { HeaderFooterEditor } from './HeaderFooterEditor';

interface ReportConfigProps {
  templates: ReportTemplateConfig[];
  setTemplates: React.Dispatch<React.SetStateAction<ReportTemplateConfig[]>>;
  assignments: ReportAssignments;
  setAssignments: React.Dispatch<React.SetStateAction<ReportAssignments>>;
  companyLogo?: string;
}

export const ReportConfig: React.FC<ReportConfigProps> = ({ templates, setTemplates, assignments, setAssignments, companyLogo }) => {
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplateConfig | null>(null);
  const [editorTemplate, setEditorTemplate] = useState<ReportTemplateConfig | null>(null);

  const handleAddTemplate = () => {
    const newTemplate: ReportTemplateConfig = {
      id: Date.now().toString(),
      name: `Modelo ${templates.length + 1}`,
      logoSize: 64,
      headerText: '',
      footerText: '',
      showSeparator: true
    };
    setTemplates([...templates, newTemplate]);
    setEditingTemplate(newTemplate);
  };

  const handleUpdateTemplate = (updated: ReportTemplateConfig) => {
    setTemplates(templates.map(t => t.id === updated.id ? updated : t));
    setEditingTemplate(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    if (editingTemplate?.id === id) {
      setEditingTemplate(null);
    }
  };

  const handleEditorSave = (updated: ReportTemplateConfig) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (editingTemplate?.id === updated.id) {
      setEditingTemplate(updated);
    }
    setEditorTemplate(null);
  };

  const getElementCount = (template: ReportTemplateConfig) => {
    const hCount = template.headerElements?.length || 0;
    const fCount = template.footerElements?.length || 0;
    return hCount + fCount;
  };

  return (
    <>
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Modelos de Relatório</h3>
            <button
              onClick={handleAddTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Novo Modelo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {templates.map(template => (
              <div 
                key={template.id}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  editingTemplate?.id === template.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
                onClick={() => setEditingTemplate(template)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                    {getElementCount(template) > 0 && (
                      <span className="text-xs text-blue-500 mt-1 block">
                        {getElementCount(template)} elemento(s) personalizado(s)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditorTemplate(template);
                      }}
                      className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                      title="Editar Cabeçalho/Rodapé"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editingTemplate && (
            <div className="space-y-6 border-t border-gray-100 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Editando: {editingTemplate.name}</h4>
                <button
                  onClick={() => setEditorTemplate(editingTemplate)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Pencil size={16} />
                  Editar Cabeçalho / Rodapé
                </button>
              </div>
              
              {((editingTemplate.headerElements && editingTemplate.headerElements.length > 0) ||
                (editingTemplate.footerElements && editingTemplate.footerElements.length > 0)) && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Este modelo possui cabeçalho/rodapé personalizado via editor visual.
                    Os campos de texto abaixo só são usados quando não há elementos personalizados.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome do Modelo</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={e => handleUpdateTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tamanho da Logo (px)</label>
                  <input
                    type="number"
                    min="32"
                    max="200"
                    value={editingTemplate.logoSize}
                    onChange={e => handleUpdateTemplate({ ...editingTemplate, logoSize: parseInt(e.target.value) || 64 })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Texto do Cabeçalho (Endereço, CNPJ, etc)</label>
                  <textarea
                    value={editingTemplate.headerText}
                    onChange={e => handleUpdateTemplate({ ...editingTemplate, headerText: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Ex: Rua Exemplo, 123 - Bairro&#10;CNPJ: 00.000.000/0001-00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Texto do Rodapé</label>
                  <textarea
                    value={editingTemplate.footerText}
                    onChange={e => handleUpdateTemplate({ ...editingTemplate, footerText: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Ex: Ohana Clean - Gestão Operacional"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showSeparator"
                    checked={editingTemplate.showSeparator}
                    onChange={e => handleUpdateTemplate({ ...editingTemplate, showSeparator: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="showSeparator" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mostrar linha separadora no cabeçalho e rodapé
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Vincular Modelos aos Relatórios</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ficha Técnica (Fórmula)</label>
              <select
                value={assignments.formula}
                onChange={e => setAssignments({ ...assignments, formula: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Padrão do Sistema</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proporção de Produção</label>
              <select
                value={assignments.proportion}
                onChange={e => setAssignments({ ...assignments, proportion: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Padrão do Sistema</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Relatório de Precificação</label>
              <select
                value={assignments.pricing}
                onChange={e => setAssignments({ ...assignments, pricing: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Padrão do Sistema</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vendas e Orçamentos</label>
              <select
                value={assignments.venda}
                onChange={e => setAssignments({ ...assignments, venda: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Padrão do Sistema</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {editorTemplate && (
        <HeaderFooterEditor
          template={editorTemplate}
          onSave={handleEditorSave}
          onClose={() => setEditorTemplate(null)}
          companyLogo={companyLogo}
        />
      )}
    </>
  );
};
