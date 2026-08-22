import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeDollarSign,
  BarChart3,
  CircleUserRound,
  CreditCard,
  Home,
  ImageUp,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Settings,
  ShieldAlert,
  Trash2
} from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const profileId = "demo-profile";

const menuItems = [
  { id: "panel", label: "Painel Principal", icon: Home },
  { id: "registration", label: "Dados cadastrais", icon: CircleUserRound },
  { id: "contact", label: "Dados de contato", icon: Phone },
  { id: "address", label: "Endereco", icon: MapPin },
  { id: "charts", label: "Graficos", icon: BarChart3 },
  { id: "debts", label: "Dividas", icon: ShieldAlert },
  { id: "credits", label: "Creditos", icon: CreditCard },
  { id: "access", label: "Acesso", icon: KeyRound },
  { id: "settings", label: "Configuracao", icon: Settings }
];

function moneyColor(index) {
  return ["#1185ff", "#00b85c", "#ffcc19", "#8f44c7", "#ff4d4d"][index % 5];
}

const scoreBandStops = [
  "#ff2323 0deg 58deg",
  "#ffd21a 58deg 121deg",
  "#22d15c 121deg 180deg",
  "transparent 180deg 360deg"
].join(", ");

const ratingScale = [
  { label: "AAA", color: "#00c853" },
  { label: "AA", color: "#39d353" },
  { label: "A", color: "#b7e34b" },
  { label: "B", color: "#ffd21a" },
  { label: "C", color: "#ff9f1a" },
  { label: "D", color: "#ff5b1a" },
  { label: "E", color: "#ff2323" }
];

const statusOptions = ["ATIVO", "INATIVO", "PENDENTE", "BLOQUEADO"];
const debtStatusOptions = ["Aberta", "Em negociacao", "Quitada", "Vencida", "Contestada"];
const ratingOptions = ratingScale.map((item) => item.label);
const resolutionReasons = ["Quitacao", "Acordo", "Erro cadastral", "Duplicidade"];

function toInputDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function fromInputDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function scoreLabelFor(score) {
  if (score >= 800) return "EXCELENTE";
  if (score >= 650) return "BOM";
  if (score >= 450) return "REGULAR";
  return "RUIM";
}

async function api(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Erro na API");
  return body;
}

function Field({ label, value, onChange, type = "text", autoComplete, name }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <Field label={label} type="date" value={toInputDate(value)} onChange={(next) => onChange(fromInputDate(next))} />
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="field field-wide">
      <span>{label}</span>
      <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const session = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onLogin(session);
    } catch (err) {
      setError("Login invalido");
    }
  }

  return (
    <main className="login-screen">
      <form className="login-box" onSubmit={submit}>
        <div className="brand-mark">S</div>
        <h1>Scoore Admin</h1>
        <Field label="E-mail" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" value={password} onChange={setPassword} />
        {error && <p className="error">{error}</p>}
        <button className="primary-button" type="submit">
          <KeyRound size={16} /> Entrar
        </button>
      </form>
    </main>
  );
}

function Sidebar({ current, setCurrent }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">MENU ADMIN</div>
      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={current === item.id ? "active" : ""}
              type="button"
              onClick={() => setCurrent(item.id)}
              title={item.label}
            >
              <Icon size={15} /> {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Header({ settings }) {
  const logoUrl = settings?.logoUrl;
  return (
    <header className="app-header">
      <div className="header-logo-slot">
        {logoUrl ? <img src={logoUrl} alt="Logo" /> : <span>LOGO</span>}
      </div>
      <div className="restricted-title">
        <LockKeyhole size={15} />
        <strong>Acesso restrito</strong>
      </div>
    </header>
  );
}

function DataPanel({ data }) {
  const rows = [
    ["Nome da Mae", data.profile.motherName],
    ["Nome do Pai", data.profile.fatherName],
    ["Nacionalidade", data.profile.nationality],
    ["Naturalidade", `${data.profile.birthCity} - ${data.profile.birthState}`],
    ["Estado Civil", data.profile.maritalStatus],
    ["Sexo", data.profile.gender],
    ["Titulo de Eleitor", "123456789012"],
    ["RG", data.profile.rg],
    ["Data de Expedicao", "10/08/2005"],
    ["Orgao Emissor", data.profile.rgIssuer],
    ["Escolaridade", data.profile.education],
    ["Profissao", data.profile.profession],
    ["Renda presumida", data.profile.income]
  ];

  return (
    <section className="panel data-panel">
      <div className="panel-header">DADOS CADASTRAIS</div>
      <div className="person-head">
        <div className="avatar"><CircleUserRound size={42} /></div>
        <div>
          <h2>{data.profile.fullName}</h2>
          <p>CPF: {data.profile.cpf}</p>
          <p>Data de Nascimento: {data.profile.birthDate} ({data.profile.ageLabel})</p>
        </div>
        <span className="status-pill">{data.profile.status}</span>
      </div>
      <div className="data-grid">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <strong>{label}:</strong>
            <span>{value}</span>
          </React.Fragment>
        ))}
      </div>
      <InfoBox icon={Phone} title="TELEFONES" lines={data.contacts.phones} />
      <InfoBox icon={Mail} title="E-MAIL" lines={data.contacts.emails} />
      <InfoBox
        icon={MapPin}
        title="ENDERECO"
        lines={[
          `${data.contacts.address.street}, ${data.contacts.address.number} - ${data.contacts.address.complement}`,
          `Bairro: ${data.contacts.address.district}`,
          `${data.contacts.address.city} - ${data.contacts.address.state}`,
          `CEP: ${data.contacts.address.zipCode}`
        ]}
      />
    </section>
  );
}

function InfoBox({ icon: Icon, title, lines }) {
  return (
    <div className="info-box">
      <Icon size={25} />
      <div>
        <h3>{title}</h3>
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
    </div>
  );
}

function ScorePanel({ indicators }) {
  const scorePercent = Math.max(0, Math.min(100, (indicators.score / indicators.scoreMax) * 100));
  const scoreAngle = Math.max(4, Math.min(180, scorePercent * 1.8));
  const currentRatingIndex = ratingScale.findIndex((item) => item.label === indicators.rating);
  return (
    <section className="panel score-panel">
      <div className="score-box">
        <div className="panel-header centered">SCORE</div>
        <div className="gauge" style={{ "--score-bands": scoreBandStops, "--score-angle": `${scoreAngle}deg` }}>
          <div className="gauge-inner">
            <strong>{indicators.score}</strong>
            <span>de {indicators.scoreMax}</span>
          </div>
        </div>
        <p className="green-label">{indicators.scoreLabel}</p>
      </div>
        <div className="rating-box">
        <div className="panel-header centered">RATING</div>
        <div className="rating-value">{indicators.rating}</div>
        <div className="rating-bars">
          {ratingScale.map((item, index) => (
            <div key={item.label} className={index === currentRatingIndex ? "rating-active" : ""}>
              <span style={{ background: item.color }} />
              <small>{item.label}</small>
            </div>
          ))}
        </div>
        <p className="green-label">{indicators.ratingLabel}</p>
      </div>
    </section>
  );
}

function CreditsPanel({ credits }) {
  const hasUsage = credits.items.some((item) => Number(item.percentage || 0) > 0);
  const sliceSize = credits.items.length ? 100 / credits.items.length : 100;
  const gradient = credits.items.map((item, index) => {
    const value = hasUsage ? Number(item.percentage || 0) : sliceSize;
    const start = hasUsage
      ? credits.items.slice(0, index).reduce((sum, current) => sum + Number(current.percentage || 0), 0)
      : index * sliceSize;
    const end = start + value;
    return `${item.color || moneyColor(index)} ${start}% ${end}%`;
  }).join(", ");

  return (
    <section className="panel credits-panel">
      <div className="panel-header">CREDITOS</div>
      <div className="credits-content">
        <div className="donut" style={{ background: `conic-gradient(${gradient || "#1185ff 0 25%, #00b85c 25% 50%, #ffcc19 50% 75%, #8f44c7 75% 100%"})` }}>
          <div><strong>{credits.total}</strong></div>
        </div>
        <div className="legend">
          {credits.items.map((item, index) => (
            <p key={item.id || item.label}>
              <span style={{ background: item.color || moneyColor(index) }} />
              {item.label}<br />
              <small>({item.percentage || 0}%) Utilizado</small>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function RestrictionsDebtsPanel({ debts, onSelect }) {
  const activeDebts = debts.filter((debt) => !["Quitada", "Removida", "Excluida"].includes(debt.status));
  const hasDebts = activeDebts.length > 0;
  return (
    <section className={`panel restrictions-debts-panel ${hasDebts ? "has-debts" : ""}`}>
      <div className="panel-header red">RESTRICOES</div>
      {!hasDebts ? (
        <strong className="nothing-found">NADA CONSTA</strong>
      ) : (
        <>
          <strong className="found-debts">CONSTA</strong>
          <div className="debt-list">
            {activeDebts.map((debt) => (
              <button key={debt.id} type="button" onClick={() => onSelect(debt)} className="debt-row">
                <span>{debt.title}</span>
                <strong>{debt.amount}</strong>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Preview({ data, onRefresh, refreshing, onDebtSelect }) {
  return (
    <div className={`preview-wrap ${refreshing ? "is-refreshing" : ""}`}>
      <div className="preview-toolbar">
        <span>Painel principal</span>
        <button type="button" onClick={onRefresh} className="primary-button compact" disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? "spin" : ""} /> {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
      <div className="scoreboard">
        {refreshing && <div className="refresh-overlay">Atualizando painel...</div>}
        <DataPanel data={data} />
        <div className="right-stack">
          <ScorePanel indicators={data.indicators} />
          <CreditsPanel credits={data.credits} />
          <RestrictionsDebtsPanel debts={data.debts} onSelect={onDebtSelect} />
        </div>
      </div>
    </div>
  );
}

function ContactListEditor({ title, kind, type, values, onChange, onAdd, onRemove }) {
  return (
    <div className="list-editor">
      <div className="list-editor-head">
        <strong>{title}</strong>
        <button className="secondary-button compact" type="button" onClick={() => onAdd(kind)}>Adicionar</button>
      </div>
      <div className="contact-lines">
        {values.map((value, index) => (
          <div className="contact-line" key={`${kind}-${index}`}>
            <Field label={`${title.slice(0, -1)} ${index + 1}`} type={type} value={value} onChange={(next) => onChange(kind, index, next)} />
            <button className="icon-danger" type="button" onClick={() => onRemove(kind, index)} title="Excluir contato"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function activeDebtsOnly(debts = []) {
  return debts.filter((debt) => !["Quitada", "Removida", "Excluida"].includes(debt.status));
}

function Editor({ current, data, setData, token, refresh, toast, onDebtSelect }) {
  const profile = data.profile;
  const contacts = data.contacts;
  const indicators = data.indicators;
  const credits = data.credits;
  const settings = data.settings || { logoUrl: "", platformName: "Scoore Admin" };
  const [newDebt, setNewDebt] = useState({ title: "", amount: "", creditor: "", dueDate: "", status: "Aberta", details: "" });
  const [access, setAccess] = useState({ login: "", password: "" });

  async function saveProfile() {
    await api(`/admin/profiles/${profileId}`, { method: "PATCH", body: JSON.stringify(profile) }, token);
    toast("Dados cadastrais salvos");
  }

  async function saveContacts() {
    await api(`/admin/profiles/${profileId}/contacts`, { method: "PATCH", body: JSON.stringify(contacts) }, token);
    toast("Contato e endereco salvos");
  }

  async function saveIndicators() {
    await api(`/admin/profiles/${profileId}/indicators`, { method: "PATCH", body: JSON.stringify(indicators) }, token);
    toast("Graficos salvos");
  }

  async function addDebt() {
    const debt = await api(`/admin/profiles/${profileId}/debts`, { method: "POST", body: JSON.stringify(newDebt) }, token);
    setData((prev) => ({ ...prev, debts: [debt, ...(prev.debts || [])] }));
    setNewDebt({ title: "", amount: "", creditor: "", dueDate: "", status: "Aberta", details: "" });
    toast("Divida adicionada");
  }

  async function saveCredits() {
    await api(`/admin/profiles/${profileId}/credits`, { method: "PATCH", body: JSON.stringify(credits) }, token);
    toast("Creditos salvos");
  }

  async function simulateRemoval(event) {
    event.preventDefault();
    const result = await api(`/admin/profiles/${profileId}/simulate-removal`, { method: "POST", body: JSON.stringify(access) }, token);
    toast(result.message);
  }

  async function saveSettings() {
    await api(`/admin/profiles/${profileId}/settings`, { method: "PATCH", body: JSON.stringify(settings) }, token);
    toast("Configuracao salva");
  }

  function uploadLogo(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setData((prev) => ({
        ...prev,
        settings: { ...(prev.settings || {}), logoUrl: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  }

  const updateProfileState = (field, value) => setData((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  const updateContactsState = (field, value) => setData((prev) => ({ ...prev, contacts: { ...prev.contacts, [field]: value } }));
  const updateAddressState = (field, value) => setData((prev) => ({ ...prev, contacts: { ...prev.contacts, address: { ...prev.contacts.address, [field]: value } } }));
  const updateIndicatorState = (field, value) => setData((prev) => {
    const nextValue = field === "score" ? Number(value) : value;
    const nextIndicators = { ...prev.indicators, [field]: nextValue };
    if (field === "rating") nextIndicators.ratingLabel = ["AAA", "AAAA", "AAAAA"].includes(nextValue) ? "EXCELENTE" : nextValue === "AA" ? "MUITO BOM" : nextValue === "A" ? "BOM" : "ATENCAO";
    return { ...prev, indicators: nextIndicators };
  });
  const updateContactItem = (kind, index, value) => {
    setData((prev) => {
      const next = [...prev.contacts[kind]];
      next[index] = value;
      return { ...prev, contacts: { ...prev.contacts, [kind]: next } };
    });
  };
  const addContactItem = (kind) => setData((prev) => ({ ...prev, contacts: { ...prev.contacts, [kind]: [...prev.contacts[kind], ""] } }));
  const removeContactItem = (kind, index) => setData((prev) => ({
    ...prev,
    contacts: { ...prev.contacts, [kind]: prev.contacts[kind].filter((_, itemIndex) => itemIndex !== index) }
  }));
  const updateCreditItem = (index, patch) => {
    const items = [...credits.items];
    items[index] = { ...items[index], ...patch };
    setData((prev) => ({ ...prev, credits: { ...prev.credits, items } }));
  };
  const addCreditItem = () => {
    const nextIndex = credits.items.length;
    setData((prev) => ({
      ...prev,
      credits: {
        ...prev.credits,
        items: [
          ...prev.credits.items,
          { id: `credit-${Date.now()}`, label: "Novo item", percentage: 0, amount: "R$ 0,00", color: moneyColor(nextIndex) }
        ]
      }
    }));
  };
  const removeCreditItem = (index) => {
    setData((prev) => ({
      ...prev,
      credits: { ...prev.credits, items: prev.credits.items.filter((_, itemIndex) => itemIndex !== index) }
    }));
  };

  return (
    <section className="editor">
      <div className="editor-title">{menuItems.find((item) => item.id === current)?.label}</div>
      {current === "registration" && (
        <div className="form-grid">
          <Field label="Nome" value={profile.fullName} onChange={(value) => updateProfileState("fullName", value)} />
          <Field label="CPF" value={profile.cpf} onChange={(value) => updateProfileState("cpf", value)} />
          <DateField label="Nascimento" value={profile.birthDate} onChange={(value) => updateProfileState("birthDate", value)} />
          <SelectField label="Status" value={profile.status} options={statusOptions} onChange={(value) => updateProfileState("status", value)} />
          <Field label="Profissao" value={profile.profession} onChange={(value) => updateProfileState("profession", value)} />
          <Field label="Renda" value={profile.income} onChange={(value) => updateProfileState("income", value)} />
          <button className="primary-button" type="button" onClick={saveProfile}><Save size={15} /> Salvar</button>
        </div>
      )}
      {current === "contact" && (
        <div className="editor-stack">
          <ContactListEditor title="Telefones" kind="phones" type="tel" values={contacts.phones} onChange={updateContactItem} onAdd={addContactItem} onRemove={removeContactItem} />
          <ContactListEditor title="E-mails" kind="emails" type="email" values={contacts.emails} onChange={updateContactItem} onAdd={addContactItem} onRemove={removeContactItem} />
          <button className="primary-button save-row" type="button" onClick={saveContacts}><Save size={15} /> Salvar contatos</button>
        </div>
      )}
      {current === "address" && (
        <div className="form-grid">
          {["street", "number", "complement", "district", "city", "state", "zipCode"].map((field) => (
            <Field key={field} label={field} value={contacts.address[field]} onChange={(value) => updateAddressState(field, value)} />
          ))}
          <button className="primary-button" type="button" onClick={saveContacts}><Save size={15} /> Salvar</button>
        </div>
      )}
      {current === "charts" && (
        <div className="form-grid">
          <Field label="Score" type="number" value={indicators.score} onChange={(value) => updateIndicatorState("score", value)} />
          <Field label="Texto do Score" value={indicators.scoreLabel} onChange={(value) => updateIndicatorState("scoreLabel", value)} />
          <SelectField label="Rating" value={indicators.rating} options={ratingOptions} onChange={(value) => updateIndicatorState("rating", value)} />
          <Field label="Texto do Rating" value={indicators.ratingLabel} onChange={(value) => updateIndicatorState("ratingLabel", value)} />
          <Field label="Ranking" value={indicators.ranking} onChange={(value) => updateIndicatorState("ranking", value)} />
          <button className="primary-button" type="button" onClick={saveIndicators}><Save size={15} /> Salvar</button>
        </div>
      )}
      {current === "debts" && (
        <div className="editor-stack">
          <div className="form-grid">
            <Field label="Titulo" value={newDebt.title} onChange={(value) => setNewDebt((prev) => ({ ...prev, title: value }))} />
            <Field label="Valor" value={newDebt.amount} onChange={(value) => setNewDebt((prev) => ({ ...prev, amount: value }))} />
            <Field label="Credor" value={newDebt.creditor} onChange={(value) => setNewDebt((prev) => ({ ...prev, creditor: value }))} />
            <DateField label="Vencimento" value={newDebt.dueDate} onChange={(value) => setNewDebt((prev) => ({ ...prev, dueDate: value }))} />
            <SelectField label="Status" value={newDebt.status} options={debtStatusOptions} onChange={(value) => setNewDebt((prev) => ({ ...prev, status: value }))} />
            <TextArea label="Detalhes do popup" value={newDebt.details} onChange={(value) => setNewDebt((prev) => ({ ...prev, details: value }))} />
            <button className="primary-button" type="button" onClick={addDebt}><BadgeDollarSign size={15} /> Adicionar divida</button>
          </div>
          <div className="admin-debt-list">
            <strong>Dividas adicionadas</strong>
            {activeDebtsOnly(data.debts).length === 0 ? (
              <p className="muted compact-muted">Nenhuma divida adicionada.</p>
            ) : (
              activeDebtsOnly(data.debts).map((debt) => (
                <button key={debt.id} type="button" className="debt-row" onClick={() => onDebtSelect(debt)}>
                  <span>{debt.title}</span>
                  <strong>{debt.amount}</strong>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {current === "credits" && (
        <div className="editor-stack">
          <Field label="Total" value={credits.total} onChange={(value) => setData((prev) => ({ ...prev, credits: { ...prev.credits, total: value } }))} />
          <div className="credit-lines">
            {credits.items.map((item, index) => (
              <div className="credit-line" key={item.id || index}>
                <Field label="Item" value={item.label} onChange={(value) => updateCreditItem(index, { label: value })} />
                <Field label="%" type="number" value={item.percentage} onChange={(value) => updateCreditItem(index, { percentage: Number(value) })} />
                <Field label="Valor" value={item.amount} onChange={(value) => updateCreditItem(index, { amount: value })} />
                <label className="field swatch-field">
                  <span>Cor</span>
                  <input type="color" value={item.color || moneyColor(index)} onChange={(event) => updateCreditItem(index, { color: event.target.value })} />
                </label>
                <button className="icon-danger" type="button" onClick={() => removeCreditItem(index)} title="Excluir item"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          <div className="action-row">
            <button className="secondary-button" type="button" onClick={addCreditItem}>Adicionar item</button>
            <button className="primary-button" type="button" onClick={saveCredits}><Save size={15} /> Salvar creditos</button>
          </div>
        </div>
      )}
      {current === "access" && (
        <form className="form-grid" onSubmit={simulateRemoval}>
          <Field label="Login" value={access.login} onChange={(value) => setAccess((prev) => ({ ...prev, login: value }))} />
          <Field label="Senha" type="password" value={access.password} onChange={(value) => setAccess((prev) => ({ ...prev, password: value }))} />
          <button className="danger-button" type="submit"><Trash2 size={15} /> Simular exclusao</button>
        </form>
      )}
      {current === "settings" && (
        <div className="editor-stack settings-editor">
          <Field label="Nome da plataforma" value={settings.platformName} onChange={(value) => setData((prev) => ({ ...prev, settings: { ...(prev.settings || {}), platformName: value } }))} />
          <label className="logo-uploader">
            <span>Logo do cabecalho</span>
            <div className="logo-upload-preview">
              {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo enviada" /> : <ImageUp size={28} />}
            </div>
            <input type="file" accept="image/*" onChange={(event) => uploadLogo(event.target.files?.[0])} />
          </label>
          <div className="action-row">
            <button className="secondary-button" type="button" onClick={() => setData((prev) => ({ ...prev, settings: { ...(prev.settings || {}), logoUrl: "" } }))}>Remover logo</button>
            <button className="primary-button" type="button" onClick={saveSettings}><Save size={15} /> Salvar configuracao</button>
          </div>
        </div>
      )}
    </section>
  );
}

function DebtModal({ debt, onClose, token, onRefresh, onResolved, toast }) {
  const [showReasons, setShowReasons] = useState(false);
  const [credentialReason, setCredentialReason] = useState("");
  const [credentials, setCredentials] = useState({ login: "", pin: "", password: "" });
  if (!debt) return null;

  async function resolve(reason, credentialPayload = null) {
    const updatedDebt = await api(`/admin/debts/${debt.id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ reason, credentials: credentialPayload })
    }, token);
    toast(reason === "Quitacao" ? "Divida quitada com sucesso" : "Registro atualizado com sucesso");
    onResolved(updatedDebt);
    onClose();
  }

  function submitCredential(event) {
    event.preventDefault();
    resolve(credentialReason || "Quitacao", credentials);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <article className={`modal ${credentialReason ? "credential-theme" : ""}`} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>x</button>
        {!credentialReason ? (
          <>
            <h2>{debt.title}</h2>
            <p><strong>Credor:</strong> {debt.creditor}</p>
            <p><strong>Valor:</strong> {debt.amount}</p>
            <p><strong>Vencimento:</strong> {debt.dueDate}</p>
            <p><strong>Status:</strong> {debt.status}</p>
            <p>{debt.details}</p>
            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={onRefresh}><RefreshCw size={15} /> Atualizar</button>
              <button className="danger-button" type="button" onClick={() => setShowReasons((current) => !current)}>Excluir</button>
            </div>
            {showReasons && (
              <div className="reason-panel">
                <strong>Motivo</strong>
                {resolutionReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCredentialReason(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <form className="credential-box" autoComplete="off" onSubmit={submitCredential}>
            <KeyRound size={30} />
            <h2>Credencial de {credentialReason}</h2>
            <Field label="Login" name="resolution_actor_id" autoComplete="off" value={credentials.login} onChange={(value) => setCredentials((prev) => ({ ...prev, login: value }))} />
            <Field label="PIN" name="resolution_actor_pin" autoComplete="new-password" type="password" value={credentials.pin} onChange={(value) => setCredentials((prev) => ({ ...prev, pin: value }))} />
            <Field label="Senha" name="resolution_actor_proof" autoComplete="new-password" type="password" value={credentials.password} onChange={(value) => setCredentials((prev) => ({ ...prev, password: value }))} />
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setCredentialReason("")}>Voltar</button>
              <button className="success-button" type="submit">Confirmar</button>
            </div>
          </form>
        )}
      </article>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [panelData, setPanelData] = useState(null);
  const [current, setCurrent] = useState("panel");
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedDebt, setSelectedDebt] = useState(null);

  const token = session?.accessToken;
  const toast = (message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2400);
  };

  async function refresh() {
    if (!token) return;
    setRefreshing(true);
    try {
      const panel = await api(`/panel/${profileId}`, {}, token);
      setData(panel);
      setPanelData(panel);
    } finally {
      setRefreshing(false);
    }
  }

  async function refreshDraftOnly() {
    if (!token) return;
    const panel = await api(`/panel/${profileId}`, {}, token);
    setData(panel);
  }

  useEffect(() => {
    refresh();
  }, [token]);

  useEffect(() => {
    function close(event) {
      if (event.key === "Escape") setSelectedDebt(null);
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  if (!session) return <Login onLogin={setSession} />;
  if (!data || !panelData) return <main className="loading">Carregando...</main>;

  return (
    <main className="app-shell">
      <Header settings={data.settings} />
      <Sidebar current={current} setCurrent={setCurrent} />
      <div className="workspace">
        {current === "panel" ? (
          <Preview data={panelData} onRefresh={refresh} refreshing={refreshing} onDebtSelect={setSelectedDebt} />
        ) : (
          <Editor current={current} data={data} setData={setData} token={token} refresh={refresh} toast={toast} onDebtSelect={setSelectedDebt} />
        )}
      </div>
      {toastMessage && <div className="toast">{toastMessage}</div>}
      <DebtModal
        debt={selectedDebt}
        token={token}
        toast={toast}
        onRefresh={refreshDraftOnly}
        onResolved={(updatedDebt) => {
          setData((prev) => ({
            ...prev,
            debts: (prev.debts || []).map((debt) => debt.id === updatedDebt.id ? updatedDebt : debt)
          }));
        }}
        onClose={() => setSelectedDebt(null)}
      />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
