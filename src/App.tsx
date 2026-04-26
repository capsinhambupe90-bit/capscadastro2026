import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, User, Calendar, Edit2, Trash2, X, Eye, CalendarClock, CalendarRange, Users, Printer, CheckCircle, RotateCcw, Lock, LogOut } from 'lucide-react';
import type { Patient, NewPatient, DateSlot, Appointment } from './types';
import { fetchData, syncData } from './api';
import { normalizeString, generateId, formatDateBr, formatDateForInput } from './utils';

const initialFormState: NewPatient = {
  name: '',
  medicalRecord: '',
  birthDate: '',
  cpf: '',
  motherName: '',
  address: '',
  gender: '',
  isIntensive: ''
};

function App() {
  // Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('caps_auth') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'pacientes' | 'datas' | 'agenda' | 'relatorio'>('pacientes');
  const [reportFilter, setReportFilter] = useState<'Total' | 'Masculino' | 'Feminino' | 'Intensivo'>('Total');

  // Dados globais
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dateSlots, setDateSlots] = useState<DateSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modais Pacientes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<NewPatient>(initialFormState);

  // Modal Agendamento (Paciente)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulePatient, setSchedulePatient] = useState<Patient | null>(null);
  const [selectedDateId, setSelectedDateId] = useState('');

  // Modais Datas
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [currentDateSlot, setCurrentDateSlot] = useState<DateSlot | null>(null);
  const [dateFormData, setDateFormData] = useState({ date: '', description: '' });

  // Agenda View
  const [selectedAgendaDateId, setSelectedAgendaDateId] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setIsLoading(true);
    const [pts, dts, apts] = await Promise.all([
      fetchData('Pacientes'),
      fetchData('Datas'),
      fetchData('Agendamentos')
    ]);
    setPatients(pts || []);
    setDateSlots(dts || []);
    setAppointments(apts || []);
    setIsLoading(false);
  };

  const savePatients = async (updatedList: Patient[]) => {
    setIsSyncing(true);
    await syncData('Pacientes', updatedList);
    setPatients(updatedList);
    setIsSyncing(false);
  };

  const saveDateSlots = async (updatedList: DateSlot[]) => {
    setIsSyncing(true);
    await syncData('Datas', updatedList);
    setDateSlots(updatedList);
    setIsSyncing(false);
  };

  const saveAppointments = async (updatedList: Appointment[]) => {
    setIsSyncing(true);
    await syncData('Agendamentos', updatedList);
    setAppointments(updatedList);
    setIsSyncing(false);
  };

  // --- Lógica de Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const users = await fetchData('Usuarios');
      const validUser = users.find((u: any) => 
        String(u.username).trim() === loginUsername.trim() && 
        String(u.password).trim() === loginPassword.trim()
      );
      
      if (validUser) {
        setIsAuthenticated(true);
        localStorage.setItem('caps_auth', 'true');
      } else {
        setLoginError('Usuário ou senha incorretos.');
      }
    } catch (error) {
      setLoginError('Erro ao conectar com o banco de dados.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('caps_auth');
    setLoginUsername('');
    setLoginPassword('');
  };

  // --- Lógica Pacientes ---
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);

  const filteredPatients = useMemo(() => {
    let result = patients;
    if (searchTerm) {
      const term = normalizeString(searchTerm);
      result = patients.filter((p) => {
        return (
          normalizeString(p.name).includes(term) ||
          normalizeString(p.cpf).includes(term) ||
          normalizeString(p.medicalRecord).includes(term) ||
          normalizeString(p.motherName).includes(term) ||
          normalizeString(p.address).includes(term) ||
          normalizeString(p.birthDate).includes(term)
        );
      });
    }
    return result.sort((a, b) => {
      const nameA = String(a.name || '');
      const nameB = String(b.name || '');
      return nameA.localeCompare(nameB, 'pt-BR');
    });
  }, [patients, searchTerm]);

  const openAddModal = () => {
    setFormData(initialFormState);
    setCurrentPatient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setCurrentPatient(patient);
    setFormData({
      name: patient.name,
      medicalRecord: patient.medicalRecord,
      birthDate: formatDateForInput(patient.birthDate),
      cpf: patient.cpf,
      motherName: patient.motherName,
      address: patient.address,
      gender: patient.gender || '',
      isIntensive: patient.isIntensive || ''
    });
    setIsModalOpen(true);
  };

  const openScheduleModal = (patient: Patient) => {
    setSchedulePatient(patient);
    setSelectedDateId('');
    setIsScheduleModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setIsScheduleModalOpen(false);
    setIsDateModalOpen(false);
    setCurrentPatient(null);
    setSchedulePatient(null);
    setCurrentDateSlot(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    let updatedList: Patient[];
    if (currentPatient) {
      updatedList = patients.map((p) =>
        p.id === currentPatient.id ? { ...p, ...formData, lastUpdate: now } : p
      );
    } else {
      updatedList = [...patients, { ...formData, id: generateId(), lastUpdate: now }];
    }
    await savePatients(updatedList);
    closeModals();
  };

  const handleDeletePatient = async (id: string) => {
    if (window.confirm('Tem certeza que deseja apagar este paciente? Isso não apaga seus agendamentos.')) {
      await savePatients(patients.filter((p) => p.id !== id));
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulePatient || !selectedDateId) return;

    const newAppt: Appointment = {
      id: generateId(),
      patientId: schedulePatient.id,
      patientName: schedulePatient.name,
      patientMedicalRecord: schedulePatient.medicalRecord,
      dateId: selectedDateId,
      status: 'Agendado'
    };
    await saveAppointments([...appointments, newAppt]);
    closeModals();
    alert('Consulta agendada com sucesso!');
  };

  // --- Lógica Datas ---
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddDateModal = () => {
    setDateFormData({ date: '', description: '' });
    setCurrentDateSlot(null);
    setIsDateModalOpen(true);
  };

  const handleSubmitDate = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedList: DateSlot[];
    if (currentDateSlot) {
      updatedList = dateSlots.map((d) =>
        d.id === currentDateSlot.id ? { ...d, ...dateFormData } : d
      );
    } else {
      updatedList = [...dateSlots, { ...dateFormData, id: generateId() }];
    }
    await saveDateSlots(updatedList);
    closeModals();
  };

  const handleDeleteDate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta data? Agendamentos vinculados poderão ficar órfãos.')) {
      await saveDateSlots(dateSlots.filter((d) => d.id !== id));
    }
  };

  // --- Lógica Agenda ---
  const handleDeleteAppt = async (id: string) => {
    if (window.confirm('Desmarcar consulta?')) {
      await saveAppointments(appointments.filter((a) => a.id !== id));
    }
  };

  const changeApptStatus = async (id: string, newStatus: Appointment['status']) => {
    await saveAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const printAgenda = () => {
    window.print();
  };


  // --- Renderers ---
  const renderPacientes = () => {
    const totalPatients = patients.length;
    const totalMasculino = patients.filter(p => p.gender === 'Masculino').length;
    const totalFeminino = patients.filter(p => p.gender === 'Feminino').length;
    const totalIntensivo = patients.filter(p => p.isIntensive === 'Sim').length;

    return (
      <div className="tab-content">
        <div className="controls-bar print-hide">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nome, CPF, prontuário, mãe..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <div className="stats-container">
            <div className="stat-badge" onClick={() => {setReportFilter('Total'); setActiveTab('relatorio');}}>Total: <strong>{totalPatients}</strong></div>
            <div className="stat-badge stat-masculino" onClick={() => {setReportFilter('Masculino'); setActiveTab('relatorio');}}>Masc: <strong>{totalMasculino}</strong></div>
            <div className="stat-badge stat-feminino" onClick={() => {setReportFilter('Feminino'); setActiveTab('relatorio');}}>Fem: <strong>{totalFeminino}</strong></div>
            <div className="stat-badge stat-intensivo" onClick={() => {setReportFilter('Intensivo'); setActiveTab('relatorio');}}>Intensivo: <strong>{totalIntensivo}</strong></div>
          </div>
          
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={20} /> Novo Paciente
          </button>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="empty-state print-hide">
            <User className="empty-icon" size={48} />
            <p className="empty-text">Nenhum paciente encontrado.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Prontuário</th>
                  <th>Nascimento</th>
                  <th>CPF</th>
                  <th>Nome da Mãe</th>
                  <th className="text-right print-hide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td style={{ fontWeight: 600 }}>
                      {patient.name}
                      {patient.isIntensive === 'Sim' && (
                        <span className="badge-intensivo" title="Paciente Intensivo">INTENSIVO</span>
                      )}
                    </td>
                    <td>{patient.medicalRecord}</td>
                    <td>{formatDateBr(patient.birthDate)}</td>
                    <td>{patient.cpf || '-'}</td>
                    <td>{patient.motherName || '-'}</td>
                    <td className="print-hide">
                      <div className="table-actions">
                        <button className="btn-icon" style={{color: '#10b981'}} onClick={() => openScheduleModal(patient)} title="Agendar Consulta">
                          <CalendarClock size={18} />
                        </button>
                        <button className="btn-icon" onClick={() => { setCurrentPatient(patient); setIsViewModalOpen(true); }} title="Ver detalhes">
                          <Eye size={18} />
                        </button>
                        <button className="btn-icon" onClick={() => openEditModal(patient)} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => handleDeletePatient(patient.id)} title="Apagar">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderDatas = () => {
    // Ordenar datas
    const sortedDates = [...dateSlots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return (
      <div className="tab-content">
        <div className="controls-bar print-hide">
          <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)'}}>Datas de Atendimento Disponíveis</h2>
          <button className="btn btn-primary" onClick={openAddDateModal}>
            <Plus size={20} /> Nova Data
          </button>
        </div>

        {sortedDates.length === 0 ? (
          <div className="empty-state print-hide">
            <CalendarRange className="empty-icon" size={48} />
            <p className="empty-text">Nenhuma data cadastrada. Adicione datas para permitir agendamentos.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição / Turno / Médico</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedDates.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{formatDateBr(d.date)}</td>
                    <td>{d.description}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" onClick={() => { setCurrentDateSlot(d); setDateFormData({date: d.date, description: d.description}); setIsDateModalOpen(true); }} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => handleDeleteDate(d.id)} title="Apagar">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAgenda = () => {
    const sortedDates = [...dateSlots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const filteredAppts = appointments.filter(a => a.dateId === selectedAgendaDateId);
    const selectedDateObj = dateSlots.find(d => d.id === selectedAgendaDateId);

    return (
      <div className="tab-content">
        <div className="controls-bar print-hide" style={{backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)'}}>
          <div style={{flex: 1}}>
            <label className="form-label">Selecione uma Data para visualizar a Agenda:</label>
            <select className="form-control" value={selectedAgendaDateId} onChange={(e) => setSelectedAgendaDateId(e.target.value)}>
              <option value="">-- Escolha uma data --</option>
              {sortedDates.map(d => (
                <option key={d.id} value={d.id}>{formatDateBr(d.date)} - {d.description}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-outline" onClick={printAgenda} disabled={!selectedAgendaDateId} style={{marginTop: '1.5rem'}}>
            <Printer size={20} /> Imprimir Lista
          </button>
        </div>

        {selectedAgendaDateId && (
          <div className="agenda-print-section mt-4">
            <div className="print-only-header" style={{display: 'none', marginBottom: '2rem'}}>
              <h1>Agenda de Consultas CAPS</h1>
              <h3>Data: {selectedDateObj ? `${formatDateBr(selectedDateObj.date)} - ${selectedDateObj.description}` : ''}</h3>
            </div>
            
            {filteredAppts.length === 0 ? (
              <div className="empty-state print-hide">
                <Users className="empty-icon" size={48} />
                <p className="empty-text">Nenhum paciente agendado para esta data.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th>Nome do Paciente</th>
                      <th>Prontuário</th>
                      <th>Status</th>
                      <th className="text-right print-hide">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppts.map((appt) => {
                      const isRealizado = appt.status === 'Realizado';
                      const isFaltou = appt.status === 'Faltou';
                      return (
                        <tr key={appt.id} style={{ opacity: isFaltou ? 0.6 : 1 }}>
                          <td style={{ fontWeight: 600, textDecoration: isRealizado ? 'line-through' : 'none' }}>{appt.patientName}</td>
                          <td>{appt.patientMedicalRecord}</td>
                          <td>
                            <span className={`status-badge ${isRealizado ? 'status-realizado' : isFaltou ? 'status-faltou' : 'status-agendado'}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="print-hide">
                            <div className="table-actions">
                              {appt.status === 'Agendado' ? (
                                <>
                                  <button className="btn-icon" style={{color: '#10b981'}} onClick={() => changeApptStatus(appt.id, 'Realizado')} title="Marcar Realizado">
                                    <CheckCircle size={18} />
                                  </button>
                                  <button className="btn-icon" style={{color: '#f59e0b'}} onClick={() => changeApptStatus(appt.id, 'Faltou')} title="Marcar Falta">
                                    <X size={18} />
                                  </button>
                                </>
                              ) : (
                                <button className="btn-icon" style={{color: '#3b82f6'}} onClick={() => changeApptStatus(appt.id, 'Agendado')} title="Desfazer e voltar para Agendado">
                                  <RotateCcw size={18} />
                                </button>
                              )}
                              <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => handleDeleteAppt(appt.id)} title="Desmarcar/Apagar">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };


  const renderRelatorio = () => {
    let filteredList = [...patients];
    if (reportFilter === 'Masculino') filteredList = patients.filter(p => p.gender === 'Masculino');
    if (reportFilter === 'Feminino') filteredList = patients.filter(p => p.gender === 'Feminino');
    if (reportFilter === 'Intensivo') filteredList = patients.filter(p => p.isIntensive === 'Sim');

    filteredList.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));

    return (
      <div className="tab-content">
        <div className="controls-bar print-hide" style={{backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)'}}>
          <div style={{flex: 1}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)'}}>
              Relatório de Pacientes: {reportFilter}
            </h2>
            <p style={{color: 'var(--text-muted)'}}>Total: {filteredList.length} registros</p>
          </div>
          <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
            <button className="btn btn-outline" onClick={() => setActiveTab('pacientes')}>
              Voltar
            </button>
            <button className="btn btn-primary" onClick={printAgenda}>
              <Printer size={20} /> Imprimir Relatório
            </button>
          </div>
        </div>

        <div className="agenda-print-section mt-4">
          <div className="print-only-header" style={{display: 'none', marginBottom: '2rem'}}>
            <h1>Relatório de Pacientes CAPS</h1>
            <h3>Categoria: {reportFilter} (Total: {filteredList.length})</h3>
          </div>
          
          <div className="table-responsive">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Nome do Paciente</th>
                  <th>Prontuário</th>
                  <th>Data de Nascimento</th>
                  <th>CPF</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.medicalRecord}</td>
                    <td>{formatDateBr(p.birthDate)}</td>
                    <td>{p.cpf || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  const patientHistory = currentPatient ? appointments
    .filter(a => a.patientId === currentPatient.id)
    .map(a => {
      const slot = dateSlots.find(d => d.id === a.dateId);
      return { ...a, dateStr: slot ? slot.date : '', desc: slot ? slot.description : '' };
    })
    .sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime()) : [];

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <Lock size={48} className="login-icon" />
            <h1>Acesso Restrito</h1>
            <p>Sistema de Gestão CAPS</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Usuário</label>
              <input 
                type="text" 
                className="form-control" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            
            <div className="form-group mt-4">
              <label className="form-label">Senha</label>
              <input 
                type="password" 
                className="form-control" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && <div className="login-error">{loginError}</div>}

            <button type="submit" className="btn btn-primary login-btn" disabled={isLoggingIn}>
              {isLoggingIn ? 'Verificando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="print-hide" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div>
          <h1>CAPS - Gestão Completa</h1>
          <p className="subtitle">Pacientes e Agendamentos</p>
        </div>
        <button className="btn btn-outline" onClick={handleLogout} style={{color: 'var(--danger)', borderColor: 'var(--danger)'}}>
          <LogOut size={18} /> Sair
        </button>
      </header>

      {/* TABS NAVEGAÇÃO */}
      <div className="tabs-nav print-hide">
        <button className={`tab-btn ${activeTab === 'pacientes' ? 'active' : ''}`} onClick={() => setActiveTab('pacientes')}>
          <Users size={18} /> Pacientes
        </button>
        <button className={`tab-btn ${activeTab === 'datas' ? 'active' : ''}`} onClick={() => setActiveTab('datas')}>
          <CalendarRange size={18} /> Configurar Datas
        </button>
        <button className={`tab-btn ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
          <CalendarClock size={18} /> Lista de Consultas
        </button>
      </div>

      {isSyncing && <div className="text-center mb-4 print-hide" style={{ color: 'var(--primary)' }}>Sincronizando dados...</div>}

      {isLoading ? (
        <div className="loader-container print-hide"><div className="loader"></div></div>
      ) : (
        <>
          {activeTab === 'pacientes' && renderPacientes()}
          {activeTab === 'datas' && renderDatas()}
          {activeTab === 'agenda' && renderAgenda()}
          {activeTab === 'relatorio' && renderRelatorio()}
        </>
      )}

      {/* --- MODAIS --- */}

      {/* Modal Paciente (Add/Edit) */}
      {isModalOpen && (
        <div className="modal-overlay print-hide" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{currentPatient ? 'Editar Paciente' : 'Novo Paciente'}</h2>
              <button className="btn-icon" onClick={closeModals}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitPatient}>
              {/* O mesmo form anterior */}
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input required type="text" name="name" className="form-control" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Número do Prontuário</label>
                    <input required type="text" name="medicalRecord" className="form-control" value={formData.medicalRecord} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <input required type="date" name="birthDate" className="form-control" value={formData.birthDate} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">CPF</label>
                    <input type="text" name="cpf" className="form-control" value={formData.cpf} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gênero <span style={{color:'red'}}>*</span></label>
                    <select required name="gender" className="form-control" value={formData.gender} onChange={handleInputChange}>
                      <option value="" disabled>Selecione...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome da Mãe</label>
                    <input type="text" name="motherName" className="form-control" value={formData.motherName} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Paciente Intensivo? <span style={{color:'red'}}>*</span></label>
                    <select required name="isIntensive" className="form-control" value={formData.isIntensive} onChange={handleInputChange}>
                      <option value="" disabled>Obrigatório...</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Endereço Completo</label>
                  <input type="text" name="address" className="form-control" value={formData.address} onChange={handleInputChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Paciente */}
      {isViewModalOpen && currentPatient && (
        <div className="modal-overlay print-hide" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Detalhes do Paciente</h2>
              <button className="btn-icon" onClick={closeModals}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" style={{color: 'var(--text-muted)'}}>Nome Completo</label>
                <div className="info-box" style={{fontSize: '1.1rem', fontWeight: 600}}>{currentPatient.name}</div>
              </div>
              <div className="form-row mt-4">
                <div className="form-group">
                  <label className="form-label" style={{color: 'var(--text-muted)'}}>Prontuário</label>
                  <div className="info-box">{currentPatient.medicalRecord}</div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{color: 'var(--text-muted)'}}>Data de Nascimento</label>
                  <div className="info-box">{formatDateBr(currentPatient.birthDate)}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{color: 'var(--text-muted)'}}>CPF</label>
                  <div className="info-box">{currentPatient.cpf || 'Não informado'}</div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{color: 'var(--text-muted)'}}>Gênero</label>
                  <div className="info-box">{currentPatient.gender}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{color: 'var(--text-muted)'}}>Nome da Mãe</label>
                  <div className="info-box">{currentPatient.motherName || 'Não informado'}</div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{color: 'var(--text-muted)'}}>Paciente Intensivo</label>
                  <div className="info-box" style={{color: currentPatient.isIntensive === 'Sim' ? '#dc2626' : 'var(--text-main)', fontWeight: currentPatient.isIntensive === 'Sim' ? 700 : 500}}>
                    {currentPatient.isIntensive || 'Não informado'}
                  </div>
                </div>
              </div>
            <div className="form-group mt-4">
                <label className="form-label" style={{color: 'var(--text-muted)'}}>Endereço</label>
                <div className="info-box">{currentPatient.address || 'Não informado'}</div>
              </div>

              <div className="mt-4" style={{borderTop: '2px solid var(--border)', paddingTop: '1.5rem'}}>
                <h3 style={{fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <CalendarClock size={20} /> Histórico de Consultas
                </h3>
                {patientHistory.length === 0 ? (
                  <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Nenhuma consulta registrada para este paciente.</p>
                ) : (
                  <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {patientHistory.map((appt, idx) => {
                      const isRealizado = appt.status === 'Realizado';
                      const isFaltou = appt.status === 'Faltou';
                      return (
                        <li key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)'}}>
                          <div>
                            <strong style={{display: 'block', fontSize: '0.95rem'}}>{formatDateBr(appt.dateStr)}</strong>
                            <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{appt.desc}</span>
                          </div>
                          <span className={`status-badge ${isRealizado ? 'status-realizado' : isFaltou ? 'status-faltou' : 'status-agendado'}`}>
                            {appt.status}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModals}>Fechar</button>
              <button className="btn btn-primary" onClick={() => { closeModals(); openEditModal(currentPatient); }}>
                <Edit2 size={18} style={{marginRight: '0.5rem'}} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Data */}
      {isDateModalOpen && (
        <div className="modal-overlay print-hide" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{currentDateSlot ? 'Editar Data' : 'Nova Data Disponível'}</h2>
              <button className="btn-icon" onClick={closeModals}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitDate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Data de Atendimento</label>
                  <input required type="date" name="date" className="form-control" value={formatDateForInput(dateFormData.date)} onChange={handleDateInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição (Turno, Médico, etc)</label>
                  <input required type="text" name="description" className="form-control" placeholder="Ex: Manhã - Dra. Maria" value={dateFormData.description} onChange={handleDateInputChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agendar Paciente */}
      {isScheduleModalOpen && schedulePatient && (
        <div className="modal-overlay print-hide" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Agendar Consulta</h2>
              <button className="btn-icon" onClick={closeModals}><X size={24} /></button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body">
                <p className="mb-4">Agendando paciente: <strong>{schedulePatient.name}</strong></p>
                <div className="form-group">
                  <label className="form-label">Escolha uma data disponível:</label>
                  <select required className="form-control" value={selectedDateId} onChange={(e) => setSelectedDateId(e.target.value)}>
                    <option value="" disabled>-- Selecione --</option>
                    {dateSlots.map(d => (
                      <option key={d.id} value={d.id}>{formatDateBr(d.date)} - {d.description}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModals}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{backgroundColor: '#10b981'}}>Confirmar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
