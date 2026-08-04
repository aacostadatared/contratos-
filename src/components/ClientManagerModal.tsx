import React, { useState } from 'react';
import { ClientProfile } from '../types';
import { INITIAL_CLIENT_PROFILES } from '../utils/clientAliases';
import { Users, Plus, Trash2, Edit2, X, Tag, Check, Save } from 'lucide-react';

interface ClientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientProfile[];
  onUpdateClients: (clients: ClientProfile[]) => void;
}

export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({
  isOpen,
  onClose,
  clients,
  onUpdateClients,
}) => {
  const [clientList, setClientList] = useState<ClientProfile[]>(
    clients && clients.length > 0 ? clients : INITIAL_CLIENT_PROFILES
  );
  const [newClientName, setNewClientName] = useState('');
  const [newAliasInputs, setNewAliasInputs] = useState<{ [clientId: string]: string }>({});

  if (!isOpen) return null;

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newProfile: ClientProfile = {
      id: `client-${Date.now()}`,
      canonical_name: newClientName.trim(),
      aliases: [newClientName.trim()],
    };

    const updated = [...clientList, newProfile];
    setClientList(updated);
    onUpdateClients(updated);
    setNewClientName('');
  };

  const handleAddAlias = (clientId: string) => {
    const text = newAliasInputs[clientId]?.trim();
    if (!text) return;

    const updated = clientList.map((c) => {
      if (c.id === clientId) {
        if (c.aliases.includes(text)) return c;
        return { ...c, aliases: [...c.aliases, text] };
      }
      return c;
    });

    setClientList(updated);
    onUpdateClients(updated);
    setNewAliasInputs((prev) => ({ ...prev, [clientId]: '' }));
  };

  const handleRemoveAlias = (clientId: string, aliasToRemove: string) => {
    const updated = clientList.map((c) => {
      if (c.id === clientId) {
        return { ...c, aliases: c.aliases.filter((a) => a !== aliasToRemove) };
      }
      return c;
    });

    setClientList(updated);
    onUpdateClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    if (!confirm('¿Eliminar esta ficha de cliente y sus alias asociadas?')) return;
    const updated = clientList.filter((c) => c.id !== clientId);
    setClientList(updated);
    onUpdateClients(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Gestión de Clientes y Aliases
              </h2>
              <p className="text-xs text-slate-500">
                Asocia variaciones de nombres (ej. BANDESAL vs Banco de Desarrollo) al mismo cliente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Add New Client Form */}
          <form onSubmit={handleAddClient} className="flex gap-2">
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Añadir nuevo cliente principal (ej: Banco Agrícola)..."
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              Añadir Cliente
            </button>
          </form>

          {/* Client Cards List */}
          <div className="space-y-3.5">
            {clientList.map((client) => (
              <div
                key={client.id}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {client.canonical_name}
                    </h3>
                    {client.contact_person && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Contacto: {client.contact_person} ({client.email || 'Sin correo'})
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Aliases Tags */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Nombres / Alias Vinculados
                  </label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {client.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="bg-white border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs"
                      >
                        <Tag className="w-3 h-3 text-indigo-600" />
                        {alias}
                        <button
                          onClick={() => handleRemoveAlias(client.id, alias)}
                          className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}

                    {/* Add Alias inline input */}
                    <div className="flex items-center gap-1 mt-1 sm:mt-0">
                      <input
                        type="text"
                        placeholder="Nuevo alias (ej: BANDESAL)..."
                        value={newAliasInputs[client.id] || ''}
                        onChange={(e) =>
                          setNewAliasInputs({ ...newAliasInputs, [client.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAlias(client.id);
                          }
                        }}
                        className="bg-white border border-slate-300 text-xs text-slate-900 px-2.5 py-1 rounded-md focus:outline-none focus:border-indigo-500 w-44"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddAlias(client.id)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-md text-xs font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
