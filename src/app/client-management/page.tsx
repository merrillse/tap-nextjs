'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  clientId: string;
  description?: string;
  environment?: 'prod' | 'non-prod' | 'both' | 'unknown';
  tenant: 'production' | 'development';
}

const DEFAULT_CLIENTS: Client[] = [
  // Production Okta Tenant Clients
  { id: '1', name: 'Missionary Graph Service Team (Us)', clientId: '0oak0jqakvevwjWrp357', environment: 'prod', tenant: 'production' },
  { id: '2', name: 'Member Tools', clientId: '0oakhtcbhyLVVeYFj357', environment: 'prod', tenant: 'production' },
  { id: '3', name: 'Ward Directory & Map', clientId: '0oamyits9uliqoOn7357', environment: 'prod', tenant: 'production' },
  { id: '4', name: 'CMIS Services Team', clientId: '0oan0z1efagK9cXWu357', environment: 'prod', tenant: 'production' },
  { id: '5', name: 'MTC Tech [PROD]', clientId: '0oan0z9i7ax38R7Tx357', environment: 'prod', tenant: 'production' },
  { id: '6', name: 'MTC Tech [non-prod]', clientId: '0oan0z7opvD8AseBb357', environment: 'non-prod', tenant: 'production' },
  { id: '7', name: 'DMBA Group [PROD]', clientId: '0oan1036pnukfeJSi357', environment: 'prod', tenant: 'production' },
  { id: '8', name: 'DMBA Group [non-prod]', clientId: '0oan1043xxD4cTtoU357', environment: 'non-prod', tenant: 'production' },
  { id: '9', name: 'Missionary Portal [non-prod]', clientId: '0oa1gg8qdjlQh49GY358', environment: 'non-prod', tenant: 'production' },
  { id: '10', name: 'Missionary Portal [PROD]', clientId: '0oa1gg90u4erOhnH2358', environment: 'prod', tenant: 'production' },
  { id: '11', name: 'Missionary Connect [PROD]', clientId: '0oap88ozbhEr8UKIQ357', environment: 'prod', tenant: 'production' },
  { id: '12', name: 'Missionary Connect [non-prod]', clientId: '0oap88us4pbRI1HX3357', environment: 'non-prod', tenant: 'production' },
  { id: '13', name: 'Missionary WORKS [PROD]', clientId: '0oaoypfnvzf56iHqv357', environment: 'prod', tenant: 'production' },
  { id: '14', name: 'Missionary WORKS [non-prod]', clientId: '0oaoywrjdh16anAjm357', environment: 'non-prod', tenant: 'production' },
  { id: '15', name: 'GVM Travel [PROD]', clientId: '0oartjm5nguKZFN2c357', environment: 'prod', tenant: 'production' },
  { id: '16', name: 'GVM Travel [non-prod]', clientId: '0oartjtss42ayIfJl357', environment: 'non-prod', tenant: 'production' },
  { id: '17', name: 'Missionary History [PROD]', clientId: '0oartjyikqPqM5LZm357', environment: 'prod', tenant: 'production' },
  { id: '18', name: 'Missionary History [non-prod]', clientId: '0oartk3ix1S0lvthA357', environment: 'non-prod', tenant: 'production' },
  { id: '19', name: 'Missionary Areabook [PROD]', clientId: '0oasw6uegahMJ8N9Y357', environment: 'prod', tenant: 'production' },
  { id: '20', name: 'Missionary Areabook [non-prod]', clientId: '0oasw5r8hmlOJ5GG0357', environment: 'non-prod', tenant: 'production' },
  { id: '21', name: 'LCR [PROD]', clientId: '0oalni7s7aEWlSTHQ357', environment: 'prod', tenant: 'production' },
  { id: '22', name: 'LCR [non-prod]', clientId: '0oalni75ar2LGLtVR357', environment: 'non-prod', tenant: 'production' },
  { id: '23', name: 'CMIS Authorization Service', clientId: '0oao4ayxo9fgtnKYj357', environment: 'prod', tenant: 'production' },
  { id: '24', name: 'Maps Service', clientId: '0oajrl8w5aVKhlkgq357', environment: 'prod', tenant: 'production' },
  { id: '25', name: 'QuickReg [PROD]', clientId: '0oaxn76jai315m4i5357', environment: 'prod', tenant: 'production' },
  { id: '26', name: 'QuickReg [non-prod]', clientId: '0oavlgns0tNH0dvXb357', environment: 'non-prod', tenant: 'production' },
  { id: '27', name: 'HR:MSR:Emergency Contact', clientId: '0oavpvglc1wJ9hVKv357', environment: 'prod', tenant: 'production' },
  { id: '28', name: 'Identity', clientId: '0oa1099z1t0ZRaFwP358', environment: 'prod', tenant: 'production' },
  { id: '29', name: 'Pathway Anthology [non-prod]', clientId: '0oa10ty566kw1iqcC358', environment: 'non-prod', tenant: 'production' },
  { id: '30', name: 'Pathway Anthology [PROD]', clientId: '0oa18avadd4EBvHhP358', environment: 'prod', tenant: 'production' },
  { id: '31', name: 'RISK-MDQ', clientId: '0oa11ext3xoSIlS9S358', environment: 'prod', tenant: 'production' },
  { id: '32', name: 'ISR - Non-prod', clientId: '0oaqbq6isq9sDyIdx357', environment: 'non-prod', tenant: 'production' },
  { id: '33', name: 'ISR - Prod', clientId: '0oapmoioz2z64riCE357', environment: 'prod', tenant: 'production' },
  { id: '34', name: 'CES', clientId: '0oa16arpkjgDezdcI358', environment: 'prod', tenant: 'production' },
  { id: '35', name: 'EDUINT - Education Integrations', clientId: '0oagzh13nq0zK7c5I357', environment: 'prod', tenant: 'production' },
  { id: '36', name: 'CCDOPS - Church Calendar', clientId: '0oa17jzhwi9uusIoz358', environment: 'prod', tenant: 'production' },
  { id: '37', name: 'CCDOPS - Church Calendar [non-prod]', clientId: '0oaki3kbszeewJmMX357', environment: 'non-prod', tenant: 'production' },
  { id: '38', name: 'CCDOPS - Church Calendar [PROD]', clientId: '0oaki3swtbO6fOZ9x357', environment: 'prod', tenant: 'production' },
  { id: '39', name: 'WAS - Ward Activity Sharing [non-prod]', clientId: '0oa1dfokrc9S2D5aO358', environment: 'non-prod', tenant: 'production' },
  { id: '40', name: 'WAS - Ward Activity Sharing [PROD]', clientId: '0oa19kxjttvFItg3y358', environment: 'prod', tenant: 'production' },
  { id: '41', name: 'English Connect', clientId: '0oaixehfyryjaiS7M357', environment: 'prod', tenant: 'production' },
  { id: '42', name: 'MBI', clientId: 'MBI', environment: 'unknown', tenant: 'production' },
  { id: '43', name: 'WSR', clientId: '0oa1gs5l1prHsbDUc358', environment: 'prod', tenant: 'production' },
  { id: '44', name: 'TallEmbark', clientId: '0oa11j79yw80Y9jwj358', environment: 'prod', tenant: 'production' },
  { id: '45', name: 'ServiceNow & Missionary Integration', clientId: '0oa1iwzkz1dcZvAIL358', environment: 'prod', tenant: 'production' },
  { id: '46', name: 'BYU MTC Track', clientId: '0oa1ji0z8v64pbNJC358', environment: 'prod', tenant: 'production' },
  { id: '47', name: 'CMIS Callings', clientId: '0oa1joivv92SShYCD358', environment: 'prod', tenant: 'production' },
  { id: '48', name: 'CARS', clientId: '0oa1ksndksjFyDt1P358', environment: 'prod', tenant: 'production' },
  
  // Development Okta Tenant Clients
  { id: '49', name: 'DevTenant_1', clientId: '0oa5uce4xpm2l7K8G5d7', environment: 'unknown', tenant: 'development' },
  { id: '50', name: 'DevTenant_2', clientId: '0oa66op0c0CAfpAkx5d7', environment: 'unknown', tenant: 'development' },
  { id: '51', name: 'DevTenant_3', clientId: '0oa66y9qcyq3WE1NY5d7', environment: 'unknown', tenant: 'development' },
  { id: '52', name: 'Automated Testing', clientId: '0oa82h6j45rN8G1he5d7', environment: 'unknown', tenant: 'development' },
];

export default function ClientManagementPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnvironment, setFilterEnvironment] = useState<string>('all');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    clientId: '',
    description: '',
    environment: 'prod',
    tenant: 'production'
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load clients from localStorage on component mount
  useEffect(() => {
    const savedClients = localStorage.getItem('clientManagement');
    if (savedClients) {
      try {
        const parsed = JSON.parse(savedClients);
        
        // Migration: Add tenant field to existing clients if missing
        const migratedClients = parsed.map((client: any) => {
          if (!client.tenant) {
            // Default to production for existing clients
            return { ...client, tenant: 'production' };
          }
          return client;
        });
        
        // Check if we need to add the new dev tenant clients
        const hasDevClients = migratedClients.some((client: Client) => client.tenant === 'development');
        if (!hasDevClients) {
          // Add dev tenant clients
          const devClients = DEFAULT_CLIENTS.filter(client => client.tenant === 'development');
          migratedClients.push(...devClients);
        }
        
        setClients(migratedClients);
      } catch (e) {
        console.error('Error parsing saved clients:', e);
        setClients(DEFAULT_CLIENTS);
      }
    } else {
      // Initialize with default clients if none exist
      setClients(DEFAULT_CLIENTS);
    }
    setIsLoaded(true);
  }, []);

  // Save clients to localStorage whenever clients array changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('clientManagement', JSON.stringify(clients));
    }
  }, [clients, isLoaded]);

  // Filter clients based on search and environment filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesEnvironment = filterEnvironment === 'all' || client.environment === filterEnvironment;
    const matchesTenant = filterTenant === 'all' || client.tenant === filterTenant;
    
    return matchesSearch && matchesEnvironment && matchesTenant;
  });

  const handleAdd = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      clientId: '',
      description: '',
      environment: 'prod',
      tenant: 'production'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      clientId: client.clientId,
      description: client.description || '',
      environment: client.environment || 'prod',
      tenant: client.tenant || 'production'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      setClients(prev => prev.filter(client => client.id !== clientId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim() || !formData.clientId?.trim()) {
      alert('Name and Client ID are required');
      return;
    }

    if (editingClient) {
      // Update existing client
      setClients(prev => prev.map(client => 
        client.id === editingClient.id 
          ? { ...client, ...formData } as Client
          : client
      ));
    } else {
      // Add new client
      const newClient: Client = {
        id: Date.now().toString(),
        name: formData.name!,
        clientId: formData.clientId!,
        description: formData.description,
        environment: formData.environment as Client['environment'],
        tenant: formData.tenant as Client['tenant']
      };
      setClients(prev => [...prev, newClient]);
    }

    setIsModalOpen(false);
    setFormData({ name: '', clientId: '', description: '', environment: 'prod', tenant: 'production' });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `client-management-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setClients(imported);
          alert(`Successfully imported ${imported.length} clients`);
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error parsing file');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset to default clients? This will overwrite all current data.')) {
      setClients(DEFAULT_CLIENTS);
    }
  };

  const forceReset = () => {
    if (confirm('This will clear localStorage and reset to defaults. All custom data will be lost. Continue?')) {
      localStorage.removeItem('clientManagement');
      setClients(DEFAULT_CLIENTS);
      alert('Successfully reset to defaults with fresh data!');
    }
  };

  const getEnvironmentBadge = (environment: Client['environment']) => {
    const colors = {
      prod: 'bg-green-100 text-green-800',
      'non-prod': 'bg-yellow-100 text-yellow-800',
      both: 'bg-blue-100 text-blue-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[environment || 'unknown']}`}>
        {environment === 'non-prod' ? 'Non-Prod' : environment?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏢</span>
        <h1 className="text-2xl font-bold">Client Management</h1>
        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Production & Development Okta Tenants</span>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterEnvironment}
              onChange={(e) => setFilterEnvironment(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Environments</option>
              <option value="prod">Production</option>
              <option value="non-prod">Non-Production</option>
              <option value="both">Both</option>
              <option value="unknown">Unknown</option>
            </select>

            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tenants</option>
              <option value="production">Production Okta</option>
              <option value="development">Development Okta</option>
            </select>

            <div className="text-sm text-gray-600">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Add Client
            </button>
            
            <button
              onClick={handleExport}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              📥 Export
            </button>
            
            <label className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm cursor-pointer">
              📤 Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={resetToDefaults}
              className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600">Total Clients</div>
          <div className="text-2xl font-bold text-blue-900">{clients.length}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600">Production Okta</div>
          <div className="text-2xl font-bold text-red-900">
            {clients.filter(c => c.tenant === 'production').length}
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="text-sm text-indigo-600">Development Okta</div>
          <div className="text-2xl font-bold text-indigo-900">
            {clients.filter(c => c.tenant === 'development').length}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600">Filtered Results</div>
          <div className="text-2xl font-bold text-green-900">{filteredClients.length}</div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Okta Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-600">{client.clientId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEnvironmentBadge(client.environment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      client.tenant === 'production' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {client.tenant === 'production' ? 'PROD Okta' : 'DEV Okta'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {client.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No clients found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID *
                </label>
                <input
                  id="clientId"
                  type="text"
                  value={formData.clientId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <select
                  id="environment"
                  value={formData.environment || 'prod'}
                  onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value as Client['environment'] }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="prod">Production</option>
                  <option value="non-prod">Non-Production</option>
                  <option value="both">Both</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 mb-1">
                  Okta Tenant *
                </label>
                <select
                  id="tenant"
                  value={formData.tenant || 'production'}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenant: e.target.value as Client['tenant'] }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="production">Production Okta Tenant</option>
                  <option value="development">Development Okta Tenant</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 text-sm hover:bg-blue-700"
                >
                  {editingClient ? 'Update' : 'Add'} Client
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">💡 Client Management Guide</h2>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Use this page to manage OAuth client configurations for different Church services</li>
          <li>• <strong>Production Okta Tenant:</strong> Live Church services and applications</li>
          <li>• <strong>Development Okta Tenant:</strong> Development and testing environments (<a href="https://dev-73389086-admin.okta.com/" target="_blank" className="underline">dev-73389086-admin.okta.com</a>)</li>
          <li>• All data is stored locally in your browser's localStorage</li>
          <li>• Export your configuration for backup or sharing with team members</li>
          <li>• Import configurations from JSON files to restore or sync data</li>
          <li>• Reset to defaults will restore the original list of Church service clients</li>
          <li>• Client IDs are public OAuth identifiers and safe to store and share</li>
        </ul>
      </div>

      {/* Documentation Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 Client Authorization & Schema Documentation</h2>
        
        <div className="space-y-6">
          {/* Authorization Process */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">🔐 List of Authorized Clients</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>For a customer/team/service to access the Missionary Graph Service, their associated Okta Client must be authorized to call us.</p>
              <p>We work closely with the Identity Team to secure access to those teams requiring access to Missionary Data. Once a customer is approved and added to our access policy, they may access the graph service.</p>
              <p><strong>Note:</strong> Additional filtering and masking of data will be applied based on the client's DSA (Data Sharing Agreement).</p>
              
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mt-3">
                <p className="font-medium text-yellow-800 mb-2">🏢 Production Okta Environment (STAGE & PROD):</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 text-xs">
                  <li>STAGE and PROD both use the Production Okta environment within the ICS organization</li>
                  <li>All Okta configurations are maintained by the Identity Team (not self-service)</li>
                  <li>Unlimited App Integrations available, but all require approval</li>
                  <li>We have our own <strong>Missionary Auth Server</strong> for customer authentication</li>
                  <li>All new clients must be added to our default access policy under a specific scope</li>
                  <li>Authorization process is managed exclusively by the Identity Team</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Development Environment */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">🧪 Development Environment</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>For our local and DEV environments, we have configured an Okta DEV Tenant created by our own team.</p>
              <p><strong>Limitation:</strong> There is a limit of 5 Applications (App Integrations), so we maintain our DEV Tenant for internal development.</p>
              <p><strong>Automated Testing:</strong> The automated testing schema should include all query and mutation attributes to allow for comprehensive testing.</p>
            </div>
          </div>

          {/* Schema Containers */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">📂 Client Schema Containers</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>Each clientId allowed by the system should have its own containing folder, named for the client. The folder should contain the schema files with the appropriate types and fields.</p>
              
              <div className="bg-white border border-gray-300 rounded p-3 mt-2">
                <p className="font-medium text-gray-800 mb-1">Schema Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>The startup folder must have a type defined for each type that appears as a parent to any other type</li>
                  <li>Example: 'Missionary' is a parent type for Assignment, so it must exist in the schema setup</li>
                  <li>The primary schema container should be a complete set of all schema elements available as a reference</li>
                  <li>The primary schema container is not used by any client directly</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-blue-100 border border-blue-300 rounded p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">🔗 Quick Reference Links</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Production Okta (STAGE & PROD):</strong> ICS organization, managed by Identity Team, unlimited apps</p>
              <p>• <strong>Development Okta:</strong> <a href="https://dev-73389086-admin.okta.com/" target="_blank" className="underline">dev-73389086-admin.okta.com</a> (5 app limit, self-managed)</p>
              <p>• <strong>Missionary Auth Server:</strong> Our dedicated Okta Auth Server for customer authentication</p>
              <p>• <strong>Schema Management:</strong> Each client requires dedicated schema container</p>
              <p>• <strong>Authorization:</strong> Identity Team approval required for production access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
