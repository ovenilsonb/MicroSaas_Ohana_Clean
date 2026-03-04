import React from 'react';
import { Pedido } from '../Vendas';

interface VendaReportProps {
  pedido: Pedido;
}

export const VendaReport: React.FC<VendaReportProps> = ({ pedido }) => {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">
            {pedido.tipo === 'venda' ? 'Pedido de Venda' : 'Orçamento'}
          </h1>
          <p className="text-gray-600 text-sm">Nº {pedido.numero || pedido.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-gray-600 text-sm">Data: {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="text-right">
          <div className="inline-block px-4 py-2 border-2 border-gray-800 rounded-lg">
            <p className="text-sm font-bold uppercase text-gray-500 mb-1">Tipo de Entrega</p>
            <p className="text-lg font-bold">
              {pedido.tipoEntrega === 'retirada' ? 'RETIRADA NO LOCAL' : 'ENTREGA'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Cliente Info */}
        <div>
          <h3 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-200 pb-2 mb-3">Dados do Cliente</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">Nome:</span> {pedido.cliente}</p>
            {pedido.telefone && <p><span className="font-semibold">Telefone:</span> {pedido.telefone}</p>}
            {pedido.email && <p><span className="font-semibold">E-mail:</span> {pedido.email}</p>}
            {pedido.endereco && <p><span className="font-semibold">Endereço:</span> {pedido.endereco}</p>}
          </div>
        </div>

        {/* Pagamento Info */}
        <div>
          <h3 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-200 pb-2 mb-3">Condições</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">Forma de Pagamento:</span> <span className="capitalize">{pedido.formaPagamento.replace('_', ' ')}</span></p>
            <p><span className="font-semibold">Status:</span> <span className="capitalize">{pedido.status}</span></p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-200 pb-2 mb-3">Itens do Pedido</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 text-left font-semibold">Produto</th>
              <th className="py-2 px-3 text-center font-semibold w-24">Qtd</th>
              <th className="py-2 px-3 text-right font-semibold w-32">Vl. Unit.</th>
              <th className="py-2 px-3 text-right font-semibold w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pedido.items.map((item, index) => (
              <tr key={item.id || index}>
                <td className="py-3 px-3">
                  <p className="font-medium">{item.nome}</p>
                </td>
                <td className="py-3 px-3 text-center">{item.quantidade}</td>
                <td className="py-3 px-3 text-right">R$ {item.precoUnitario.toFixed(2)}</td>
                <td className="py-3 px-3 text-right font-medium">R$ {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span>R$ {pedido.subtotal.toFixed(2)}</span>
          </div>
          {pedido.desconto > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Desconto:</span>
              <span>-R$ {pedido.desconto.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-2">
            <span>Total:</span>
            <span>R$ {pedido.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Observações */}
      {pedido.observacoes && pedido.observacoes !== '<p><br></p>' && (
        <div>
          <h3 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-200 pb-2 mb-3">Observações</h3>
          <div 
            className="text-sm text-gray-700 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: pedido.observacoes }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>Documento gerado em {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
};
