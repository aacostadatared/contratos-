import React, { useState, useEffect, useMemo } from 'react';
import { Contract, ClientProfile } from './types';
import { INITIAL_CONTRACTS } from './data/initialData';
import { INITIAL_CLIENT_PROFILES, findCanonicalClient, normalizeSearchTerm } from './utils/clientAliases';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { FolderView } from './components/FolderView';
import { ContractCards } from './components/ContractCards';
import { ContractTable } from './components/ContractTable';
import { BatchUploadModal } from './components/BatchUploadModal';
import { ContractDetailModal } from './components/ContractDetailModal';
import { ClientManagerModal } from './components/ClientManagerModal';

export default function App() {
  // Persistence in LocalStorage
  const [contracts, setContracts] = useState<Contract[]>(() => {
    try {
      const saved = localStorage.getItem('datared_contracts_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading contracts from localStorage:', e);
    }
    return INITIAL_CONTRACTS;
  });

  const [clients, setClients] = useState<ClientProfile[]>(() => {
    try {
      const saved = localStorage.getItem('datared_clients_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading clients from localStorage:', e);
    }
    return INITIAL_CLIENT_PROFILES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('datared_contracts_v1', JSON.stringify(contracts));
    } catch (e) {
      console.error('Error saving contracts:', e);
    }
  }, [contracts]);

  useEffect(() => {
    try {
      localStorage.setItem('datared_clients_v1', JSON.stringify(clients));
    } catch (e) {
      console.error('Error saving clients:', e);
    }
  }, [clients]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<'all' | 'datared' | 'red'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'folders' | 'cards' | 'table'>('folders');

  // Modals state
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
  const [selectedContractForDetail, setSelectedContractForDetail] = useState<Contract | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter logic (supports 1x1 letter-by-letter matching & alias resolution)
  const filteredContracts = useMemo(() => {
    const cleanSearch = normalizeSearchTerm(searchTerm);

    return contracts.filter((contract) => {
      // Brand filter
      if (selectedBrand !== 'all' && contract.brand !== selectedBrand) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && contract.service_category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && contract.status !== selectedStatus) {
        return false;
      }

      // Search term filter (character by character / letter by letter)
      if (cleanSearch) {
        const titleNorm = normalizeSearchTerm(contract.title);
        const clientNorm = normalizeSearchTerm(contract.client_name);
        const rawClientNorm = normalizeSearchTerm(contract.raw_client_name || '');
        const summaryNorm = normalizeSearchTerm(contract.summary || '');
        const serviceNorm = normalizeSearchTerm(contract.service_name || '');
        const termsNorm = normalizeSearchTerm(contract.key_terms || '');

        const matchesMain =
          titleNorm.includes(cleanSearch) ||
          clientNorm.includes(cleanSearch) ||
          rawClientNorm.includes(cleanSearch) ||
          summaryNorm.includes(cleanSearch) ||
          serviceNorm.includes(cleanSearch) ||
          termsNorm.includes(cleanSearch);

        if (matchesMain) return true;

        // Check if search matches client aliases
        const matchedClient = clients.find(
          (c) =>
            normalizeSearchTerm(c.canonical_name).includes(cleanSearch) ||
            c.aliases.some((alias) => normalizeSearchTerm(alias).includes(cleanSearch))
        );

        if (matchedClient && contract.client_name === matchedClient.canonical_name) {
          return true;
        }

        return false;
      }

      return true;
    });
  }, [contracts, clients, searchTerm, selectedBrand, selectedCategory, selectedStatus]);

  // Handlers
  const handleSaveBatchContracts = (newContracts: Omit<Contract, 'id' | 'created_at'>[]) => {
    const created: Contract[] = newContracts.map((nc, idx) => {
      const { canonicalName } = findCanonicalClient(nc.client_name, clients);
      return {
        ...nc,
        client_name: canonicalName,
        id: `ctr-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        created_at: new Date().toISOString(),
      };
    });

    setContracts((prev) => [...created, ...prev]);
  };

  const handleSaveContractDetail = (updated: Contract) => {
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteContract = (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este contrato?')) return;
    setContracts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleOpenDetail = (contract: Contract) => {
    setSelectedContractForDetail(contract);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenBatchUpload={() => setIsBatchUploadOpen(true)}
        onOpenClientManager={() => setIsClientManagerOpen(true)}
        totalContractsCount={contracts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Key Indicators Bar */}
        <StatsOverview contracts={filteredContracts} />

        {/* View Switcher Output */}
        {viewMode === 'folders' && (
          <FolderView
            contracts={filteredContracts}
            onViewContract={handleOpenDetail}
            onEditContract={handleOpenDetail}
            onDeleteContract={handleDeleteContract}
          />
        )}

        {viewMode === 'cards' && (
          <ContractCards
            contracts={filteredContracts}
            onViewContract={handleOpenDetail}
            onEditContract={handleOpenDetail}
            onDeleteContract={handleDeleteContract}
          />
        )}

        {viewMode === 'table' && (
          <ContractTable
            contracts={filteredContracts}
            onViewContract={handleOpenDetail}
            onEditContract={handleOpenDetail}
            onDeleteContract={handleDeleteContract}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>DataRed & RED · Sistema de Gestión de Contratos e Inteligencia Documental © {new Date().getFullYear()}</p>
      </footer>

      {/* Modals */}
      <BatchUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => setIsBatchUploadOpen(false)}
        onSaveBatch={handleSaveBatchContracts}
      />

      <ContractDetailModal
        contract={selectedContractForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSave={handleSaveContractDetail}
      />

      <ClientManagerModal
        isOpen={isClientManagerOpen}
        onClose={() => setIsClientManagerOpen(false)}
        clients={clients}
        onUpdateClients={setClients}
      />

    </div>
  );
}
