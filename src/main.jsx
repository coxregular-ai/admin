import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeDollarSign,
  BarChart3,
  ChevronDown,
  CircleUserRound,
  CreditCard,
  Edit3,
  LogOut,
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
  { id: "panel", label: "PAINEL RESTRITO", icon: Home },
  { id: "registration", label: "DADOS CADASTRAIS", icon: CircleUserRound },
  { id: "contact", label: "CONTATO", icon: Phone },
  { id: "address", label: "ENDEREÇO", icon: MapPin },
  { id: "charts", label: "SCORE", icon: BarChart3 },
  { id: "rating", label: "RATING", icon: BarChart3 },
  { id: "debts", label: "RESTRIÇÕES", icon: ShieldAlert },
  { id: "credits", label: "LINHA DE CRÉDITO", icon: CreditCard },
  { id: "settings", label: "CONFIGURAÇÃO", icon: Settings }
];

function moneyColor(index) {
  return ["#1185ff", "#00b85c", "#ffcc19", "#8f44c7", "#ff4d4d"][index % 5];
}

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
const maritalStatusOptions = ["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO ESTAVEL", "SEPARADO"];
const genderOptions = ["MASCULINO", "FEMININO", "OUTRO", "NAO INFORMADO"];
const educationOptions = [
  "FUNDAMENTAL INCOMPLETO",
  "FUNDAMENTAL COMPLETO",
  "MEDIO INCOMPLETO",
  "MEDIO COMPLETO",
  "SUPERIOR INCOMPLETO",
  "SUPERIOR COMPLETO",
  "POS-GRADUACAO",
  "MESTRADO",
  "DOUTORADO"
];
const debtStatusOptions = ["Aberta", "Em negociacao", "Quitada", "Vencida", "Contestada"];
const ratingOptions = ratingScale.map((item) => item.label);
const resolutionReasons = ["Quitacao", "Acordo", "Erro cadastral", "Duplicidade"];
const resolutionSuccessMessage = "RESTRIÇÃO EXCLUÍDA";

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

function formatSnapshotDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
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

function Field({ label, value, onChange, type = "text", autoComplete, name, min, max, readOnly }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        min={min}
        max={max}
        readOnly={readOnly}
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
  const current = value ?? "";
  // mantem na lista um valor ja gravado que nao esteja entre as opcoes padrao
  const allOptions = current && !options.includes(current) ? [current, ...options] : options;
  return (
    <label className="field">
      <span>{label}</span>
      <select value={current} onChange={(event) => onChange(event.target.value)}>
        {allOptions.map((option) => <option key={option} value={option}>{option}</option>)}
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

function fileToProfilePhotoUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erro ao ler imagem"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Imagem invalida"));
      image.onload = () => {
        const width = 390;
        const height = 520;
        const targetRatio = width / height;
        const sourceRatio = image.width / image.height;
        const sourceWidth = sourceRatio > targetRatio ? image.height * targetRatio : image.width;
        const sourceHeight = sourceRatio > targetRatio ? image.height : image.width / targetRatio;
        const sourceX = (image.width - sourceWidth) / 2;
        const sourceY = (image.height - sourceHeight) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
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

function Header({ settings, onLogout }) {
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
      <div className="header-credentials">
        {/* nomes neutros + autoComplete new-password evitam o preenchimento automatico do navegador */}
        <label>
          <span>Credencial digital</span>
          <input type="text" name="header_access_id" autoComplete="new-password" />
        </label>
        <label>
          <span>PIN</span>
          <input type="password" name="header_access_pin" autoComplete="new-password" />
        </label>
        <label>
          <span>Senha</span>
          <input type="password" name="header_access_proof" autoComplete="new-password" />
        </label>
        <button type="button" className="credentials-go">Ir</button>
      </div>
      <button type="button" className="logout-button" onClick={onLogout}>
        <LogOut size={15} /> Sair
      </button>
    </header>
  );
}

function addressLines(address = {}) {
  return String(address.fullText || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function DataPanel({ data, onRefresh, refreshing }) {
  const rows = [
    ["Nome da Mae", data.profile.motherName],
    ["Nome do Pai", data.profile.fatherName],
    ["Nacionalidade", data.profile.nationality],
    ["Naturalidade", `${data.profile.birthCity} - ${data.profile.birthState}`],
    ["Estado Civil", data.profile.maritalStatus],
    ["Sexo", data.profile.gender],
    ["Titulo de Eleitor", data.profile.voterId],
    ["RG", data.profile.rg],
    ["Data de Expedicao", data.profile.rgIssueDate],
    ["Orgao Emissor", data.profile.rgIssuer],
    ["Escolaridade", data.profile.education],
    ["Profissao", data.profile.profession],
    // celula vazia para empurrar a renda presumida para a coluna da direita
    [null, null],
    ["Renda presumida", data.profile.income]
  ];

  return (
    <section className="panel data-panel">
      <div className="panel-header">Dados Cadastrais</div>
      <div className="person-head">
        <div className="avatar">
          {data.profile.photoUrl ? <img src={data.profile.photoUrl} alt="Foto do usuario" /> : <CircleUserRound size={42} />}
        </div>
        <div>
          <h2>{data.profile.fullName}</h2>
          <p>CPF: {data.profile.cpf}</p>
          <p>Data de Nascimento: {data.profile.birthDate} ({data.profile.ageLabel})</p>
        </div>
        <span className="status-pill">{data.profile.status}</span>
      </div>
      <div className="data-grid">
        {rows.map(([label, value], index) => (
          <React.Fragment key={label || `spacer-${index}`}>
            <strong>{label ? `${label}:` : ""}</strong>
            <span>{value}</span>
          </React.Fragment>
        ))}
      </div>
      <InfoBox icon={Phone} title="Telefones" lines={data.contacts.phones} />
      <InfoBox icon={Mail} title="E-mail" lines={data.contacts.emails} />
      <InfoBox icon={MapPin} title="Endereço" lines={addressLines(data.contacts.address)} />
      <div className="data-refresh-row">
        <button type="button" onClick={onRefresh} className="primary-button compact" disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? "spin" : ""} /> {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
    </section>
  );
}

function InfoBox({ icon: Icon, title, lines }) {
  return (
    <div className="info-box">
      <Icon size={25} />
      <div>
        <h3>{title}</h3>
        {lines.map((line, index) => <p key={index}>{line}</p>)}
      </div>
    </div>
  );
}

function ScorePanel({ indicators }) {
  const scoreMax = 1000;
  const score = Math.max(0, Math.min(scoreMax, Number(indicators.score || 0)));
  const currentRatingIndex = ratingScale.findIndex((item) => item.label === indicators.rating);
  const currentRating = ratingScale[currentRatingIndex] || ratingScale[ratingScale.length - 1];
  return (
    <section className="panel score-panel">
      <div className="score-box">
        <div className="panel-header centered">Score</div>
        <div className="gauge">
          <svg className="gauge-svg" viewBox="0 0 220 132" aria-hidden="true" focusable="false">
            <path className="gauge-segment gauge-red" d="M 20 112 A 90 90 0 0 1 63 35" />
            <path className="gauge-segment gauge-yellow" d="M 70 31 A 90 90 0 0 1 150 31" />
            <path className="gauge-segment gauge-green" d="M 157 35 A 90 90 0 0 1 200 112" />
          </svg>
          <div className="gauge-inner">
            <strong>{score}</strong>
            <span>de {scoreMax}</span>
          </div>
        </div>
        <p className="green-label score-status-label">{indicators.scoreLabel}</p>
      </div>
        <div className="rating-box">
        <div className="panel-header centered">Rating</div>
        <div className="rating-value" style={{ color: currentRating.color }}>{indicators.rating}</div>
        <div className="rating-bars">
          {ratingScale.map((item, index) => (
            <div key={item.label} className={index === currentRatingIndex ? "rating-active" : ""}>
              <span style={{ background: item.color }} />
              <small>{item.label}</small>
            </div>
          ))}
        </div>
        <p className="green-label rating-status-label" style={{ color: currentRating.color }}>{indicators.ratingLabel}</p>
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
      <div className="panel-header">Créditos</div>
      <div className="credits-content">
        <div className="donut" style={{ background: `conic-gradient(${gradient || "#1185ff 0 25%, #00b85c 25% 50%, #ffcc19 50% 75%, #8f44c7 75% 100%"})` }}>
          <div><strong>{credits.total}</strong></div>
        </div>
        <div className="legend">
          {credits.items.map((item, index) => (
            <p key={item.id || item.label}>
              <span style={{ background: item.color || moneyColor(index) }} />
              {item.label} <strong>{item.percentage || 0}%</strong>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

const restrictionFilters = ["DÍVIDAS", "DÍVIDAS ATIVA", "PROTESTOS", "CCF", "VENCIDOS", "PREJUÍZOS"];

const inactiveDebtStatuses = ["Quitada", "Removida", "Excluida"];

function debtContent(debt = {}) {
  return String(debt.content || debt.details || debt.title || "").trim();
}

function debtSummary(debt = {}) {
  return debtContent(debt).replace(/\s+/g, " ").trim() || "Restricao";
}

function RestrictionsDebtsPanel({ debts, onSelect }) {
  const [activeFilter, setActiveFilter] = useState(null);
  const activeDebts = debts.filter((debt) => !inactiveDebtStatuses.includes(debt.status));
  const filteredDebts = activeFilter
    ? activeDebts.filter((debt) => (debt.category || "DÍVIDAS") === activeFilter)
    : activeDebts;
  const hasFilteredDebts = filteredDebts.length > 0;
  const openDebtDetails = (debt) => {
    setActiveFilter(null);
    onSelect(debt);
  };

  return (
    <>
      <section className={`panel restrictions-debts-panel ${activeDebts.length > 0 ? "has-debts" : ""}`}>
        <div className="panel-header red">Restrições</div>
        <div className="restriction-actions">
          {restrictionFilters.map((filter) => (
            <button key={filter} type="button" onClick={() => setActiveFilter(filter)}>
              {filter}
            </button>
          ))}
        </div>
      </section>
      {activeFilter && (
        <div className="modal-backdrop" onClick={() => setActiveFilter(null)}>
          <article className="modal restriction-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setActiveFilter(null)}>x</button>
            <span className="restriction-modal-eyebrow">RESTRICOES</span>
            <h2>{activeFilter}</h2>
            {!hasFilteredDebts ? (
              <div className="restriction-empty">
                <strong>NADA CONSTA</strong>
              </div>
            ) : (
              <div className="restriction-popup-list">
                {filteredDebts.map((debt) => (
                  <button key={debt.id} type="button" onClick={() => openDebtDetails(debt)} className="restriction-popup-row">
                    <span>
                      <strong>{debtContent(debt)}</strong>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </article>
        </div>
      )}
    </>
  );
}

function Preview({ data, onRefresh, refreshing, onDebtSelect }) {
  return (
    <div className={`preview-wrap ${refreshing ? "is-refreshing" : ""}`}>
      <div className="scoreboard">
        {refreshing && <div className="refresh-overlay">Atualizando painel...</div>}
        <DataPanel data={data} onRefresh={onRefresh} refreshing={refreshing} />
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
  return debts.filter((debt) => !inactiveDebtStatuses.includes(debt.status));
}

function Editor({
  current,
  data,
  setData,
  setPanelData,
  token,
  refresh,
  toast,
  onDebtSelect,
  snapshots,
  onCreateSnapshot,
  onLoadSnapshot,
  onDeleteSnapshot
}) {
  const profile = data.profile;
  const contacts = data.contacts;
  const indicators = data.indicators;
  const credits = data.credits;
  const settings = data.settings || { logoUrl: "", platformName: "Scoore Admin" };
  const [newDebtsText, setNewDebtsText] = useState("");
  const [newDebtCategory, setNewDebtCategory] = useState(restrictionFilters[0]);
  const [editingDebtId, setEditingDebtId] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [snapshotName, setSnapshotName] = useState("");
  const editingDebt = (data.debts || []).find((debt) => debt.id === editingDebtId);

  async function runAction(actionId, action) {
    if (pendingAction) return;
    setPendingAction(actionId);
    try {
      await action();
    } finally {
      setPendingAction("");
    }
  }

  const isPending = (actionId) => pendingAction === actionId;
  const disableActions = Boolean(pendingAction);

  async function saveProfile() {
    await runAction("profile", async () => {
      const savedProfile = await api(`/admin/profiles/${profileId}`, { method: "PATCH", body: JSON.stringify(profile) }, token);
      setPanelData((prev) => prev ? { ...prev, profile: { ...prev.profile, ...savedProfile } } : prev);
      toast("Dados cadastrais salvos");
    });
  }

  async function saveContacts() {
    await runAction("contacts", async () => {
      await api(`/admin/profiles/${profileId}/contacts`, { method: "PATCH", body: JSON.stringify(contacts) }, token);
      toast("Contato e endereco salvos");
    });
  }

  async function saveIndicators() {
    await runAction("indicators", async () => {
      await api(`/admin/profiles/${profileId}/indicators`, { method: "PATCH", body: JSON.stringify({ ...indicators, scoreMax: 1000 }) }, token);
      toast("Graficos salvos");
    });
  }

  async function addDebt() {
    await runAction("addDebt", async () => {
      const content = newDebtsText.trim();
      if (!content) {
        toast("Informe ao menos uma divida");
        return;
      }
      const debt = await api(`/admin/profiles/${profileId}/debts`, {
        method: "POST",
        body: JSON.stringify({
          title: content,
          content,
          category: newDebtCategory,
          amount: "",
          dueDate: "",
          status: "Aberta",
          details: content
        })
      }, token);
      setData((prev) => ({ ...prev, debts: [debt, ...(prev.debts || [])] }));
      setPanelData((prev) => prev ? { ...prev, debts: [debt, ...(prev.debts || [])] } : prev);
      setNewDebtsText("");
      toast("Divida adicionada");
    });
  }

  async function saveDebt(debt) {
    await runAction(`debt-${debt.id}`, async () => {
      const savedDebt = await api(`/admin/debts/${debt.id}`, { method: "PATCH", body: JSON.stringify(debt) }, token);
      setData((prev) => ({
        ...prev,
        debts: (prev.debts || []).map((item) => (item.id === savedDebt.id ? savedDebt : item))
      }));
      setPanelData((prev) => prev ? {
        ...prev,
        debts: (prev.debts || []).map((item) => (item.id === savedDebt.id ? savedDebt : item))
      } : prev);
      toast("Divida atualizada");
    });
  }

  async function saveCredits() {
    await runAction("credits", async () => {
      await api(`/admin/profiles/${profileId}/credits`, { method: "PATCH", body: JSON.stringify(credits) }, token);
      toast("Creditos salvos");
    });
  }

  async function saveSettings() {
    await runAction("settings", async () => {
      await api(`/admin/profiles/${profileId}/settings`, { method: "PATCH", body: JSON.stringify(settings) }, token);
      toast("Configuracao salva");
    });
  }

  async function createSnapshotVersion() {
    await runAction("snapshot-save", async () => {
      await onCreateSnapshot(snapshotName);
      setSnapshotName("");
    });
  }

  async function loadSnapshotVersion(snapshotId) {
    await runAction(`snapshot-load-${snapshotId}`, async () => {
      await onLoadSnapshot(snapshotId);
    });
  }

  async function deleteSnapshotVersion(snapshotId) {
    await runAction(`snapshot-delete-${snapshotId}`, async () => {
      await onDeleteSnapshot(snapshotId);
    });
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

  async function uploadProfilePhoto(file) {
    if (!file) return;
    await runAction("profilePhoto", async () => {
      const photoUrl = await fileToProfilePhotoUrl(file);
      const nextProfile = { ...profile, photoUrl };
      setData((prev) => ({ ...prev, profile: { ...prev.profile, photoUrl } }));
      setPanelData((prev) => prev ? { ...prev, profile: { ...prev.profile, photoUrl } } : prev);
      const savedProfile = await api(`/admin/profiles/${profileId}`, { method: "PATCH", body: JSON.stringify(nextProfile) }, token);
      setData((prev) => ({ ...prev, profile: { ...prev.profile, ...savedProfile } }));
      setPanelData((prev) => prev ? { ...prev, profile: { ...prev.profile, ...savedProfile } } : prev);
      toast("Foto salva");
    });
  }

  const updateProfileState = (field, value) => setData((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  const updateContactsState = (field, value) => setData((prev) => ({ ...prev, contacts: { ...prev.contacts, [field]: value } }));
  const updateAddressState = (field, value) => setData((prev) => ({ ...prev, contacts: { ...prev.contacts, address: { ...prev.contacts.address, [field]: value } } }));
  const updateIndicatorState = (field, value) => setData((prev) => {
    const nextValue = field === "score" ? Math.max(0, Math.min(1000, Number(value || 0))) : value;
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
  const updateDebtItem = (debtId, patch) => {
    setData((prev) => ({
      ...prev,
      debts: (prev.debts || []).map((debt) => (debt.id === debtId ? { ...debt, ...patch } : debt))
    }));
  };
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
          <label className="profile-photo-uploader">
            <span>Foto do usuario</span>
            <div className="profile-photo-preview">
              {profile.photoUrl ? <img src={profile.photoUrl} alt="Foto enviada" /> : <CircleUserRound size={34} />}
            </div>
            <input type="file" accept="image/*" onChange={(event) => uploadProfilePhoto(event.target.files?.[0])} />
          </label>
          <Field label="Nome" value={profile.fullName} onChange={(value) => updateProfileState("fullName", value)} />
          <Field label="CPF" value={profile.cpf} onChange={(value) => updateProfileState("cpf", value)} />
          <DateField label="Nascimento" value={profile.birthDate} onChange={(value) => updateProfileState("birthDate", value)} />
          <Field label="Idade" value={profile.ageLabel} onChange={(value) => updateProfileState("ageLabel", value)} />
          <SelectField label="Status" value={profile.status} options={statusOptions} onChange={(value) => updateProfileState("status", value)} />
          <Field label="Nome da Mae" value={profile.motherName} onChange={(value) => updateProfileState("motherName", value)} />
          <Field label="Nome do Pai" value={profile.fatherName} onChange={(value) => updateProfileState("fatherName", value)} />
          <Field label="Nacionalidade" value={profile.nationality} onChange={(value) => updateProfileState("nationality", value)} />
          <Field label="Naturalidade (cidade)" value={profile.birthCity} onChange={(value) => updateProfileState("birthCity", value)} />
          <Field label="Naturalidade (UF)" value={profile.birthState} onChange={(value) => updateProfileState("birthState", value)} />
          <SelectField label="Estado Civil" value={profile.maritalStatus} options={maritalStatusOptions} onChange={(value) => updateProfileState("maritalStatus", value)} />
          <SelectField label="Sexo" value={profile.gender} options={genderOptions} onChange={(value) => updateProfileState("gender", value)} />
          <Field label="Titulo de Eleitor" value={profile.voterId} onChange={(value) => updateProfileState("voterId", value)} />
          <Field label="RG" value={profile.rg} onChange={(value) => updateProfileState("rg", value)} />
          <DateField label="Data de Expedicao" value={profile.rgIssueDate} onChange={(value) => updateProfileState("rgIssueDate", value)} />
          <Field label="Orgao Emissor" value={profile.rgIssuer} onChange={(value) => updateProfileState("rgIssuer", value)} />
          <Field label="UF do RG" value={profile.rgState} onChange={(value) => updateProfileState("rgState", value)} />
          <SelectField label="Escolaridade" value={profile.education} options={educationOptions} onChange={(value) => updateProfileState("education", value)} />
          <Field label="Profissao" value={profile.profession} onChange={(value) => updateProfileState("profession", value)} />
          <Field label="Renda presumida" value={profile.income} onChange={(value) => updateProfileState("income", value)} />
          <button className={`primary-button ${isPending("profile") ? "action-busy" : ""}`} type="button" onClick={saveProfile} disabled={disableActions}><Save size={15} /> {isPending("profile") ? "Salvando..." : "Salvar"}</button>
        </div>
      )}
      {current === "contact" && (
        <div className="editor-stack">
          <ContactListEditor title="Telefones" kind="phones" type="tel" values={contacts.phones} onChange={updateContactItem} onAdd={addContactItem} onRemove={removeContactItem} />
          <ContactListEditor title="E-mails" kind="emails" type="email" values={contacts.emails} onChange={updateContactItem} onAdd={addContactItem} onRemove={removeContactItem} />
          <button className={`primary-button save-row ${isPending("contacts") ? "action-busy" : ""}`} type="button" onClick={saveContacts} disabled={disableActions}><Save size={15} /> {isPending("contacts") ? "Salvando..." : "Salvar contatos"}</button>
        </div>
      )}
      {current === "address" && (
        <div className="editor-stack">
          <TextArea
            label="Endereco completo (uma linha por quebra de linha)"
            value={contacts.address.fullText}
            onChange={(value) => updateAddressState("fullText", value)}
          />
          <div className="action-row">
            <button className={`primary-button ${isPending("contacts") ? "action-busy" : ""}`} type="button" onClick={saveContacts} disabled={disableActions}><Save size={15} /> {isPending("contacts") ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      )}
      {(current === "charts" || current === "rating") && (
        <div className="form-grid">
          <Field label="Score" type="number" min="0" max="1000" value={indicators.score} onChange={(value) => updateIndicatorState("score", value)} />
          <Field label="Score maximo" type="number" value={1000} readOnly onChange={() => {}} />
          <Field label="Texto do Score" value={indicators.scoreLabel} onChange={(value) => updateIndicatorState("scoreLabel", value)} />
          <SelectField label="Rating" value={indicators.rating} options={ratingOptions} onChange={(value) => updateIndicatorState("rating", value)} />
          <Field label="Texto do Rating" value={indicators.ratingLabel} onChange={(value) => updateIndicatorState("ratingLabel", value)} />
          <Field label="Ranking" value={indicators.ranking} onChange={(value) => updateIndicatorState("ranking", value)} />
          <button className={`primary-button ${isPending("indicators") ? "action-busy" : ""}`} type="button" onClick={saveIndicators} disabled={disableActions}><Save size={15} /> {isPending("indicators") ? "Salvando..." : "Salvar"}</button>
        </div>
      )}
      {current === "debts" && (
        <div className="editor-stack">
          <div className="single-field-editor">
            <div className="debt-entry-grid">
              <TextArea
                label="Conteudo da restricao (todo este campo vira uma unica restricao)"
                value={newDebtsText}
                onChange={setNewDebtsText}
              />
              <div className="debt-category-picker">
                <span>Tipo</span>
                <label className="type-menu">
                  <select value={newDebtCategory} onChange={(event) => setNewDebtCategory(event.target.value)}>
                    {restrictionFilters.map((filter) => <option key={filter} value={filter}>{filter}</option>)}
                  </select>
                  <ChevronDown size={16} />
                </label>
              </div>
            </div>
            <div className="action-row">
              <button className={`primary-button ${isPending("addDebt") ? "action-busy" : ""}`} type="button" onClick={addDebt} disabled={disableActions}>
                <BadgeDollarSign size={15} /> {isPending("addDebt") ? "Adicionando..." : "Adicionar restricao"}
              </button>
            </div>
          </div>
          <div className="admin-debt-list">
            <strong>Dividas adicionadas</strong>
            {activeDebtsOnly(data.debts).length === 0 ? (
              <p className="muted compact-muted">Nenhuma divida adicionada.</p>
            ) : (
              activeDebtsOnly(data.debts).map((debt) => (
                <div className="debt-summary-row" key={debt.id}>
                  <div>
                    <strong>{debtContent(debt)}</strong>
                    <span>{debt.category || restrictionFilters[0]} · {debt.status || "Aberta"}</span>
                  </div>
                  <div className="debt-summary-actions">
                    <button className="secondary-button compact" type="button" onClick={() => onDebtSelect(debt)}>Popup</button>
                    <button
                      className="primary-button compact"
                      type="button"
                      disabled={disableActions}
                      onClick={() => setEditingDebtId(debt.id)}
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {editingDebt && (
        <div className="modal-backdrop" onClick={() => setEditingDebtId("")}>
          <article className="modal debt-edit-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setEditingDebtId("")}>x</button>
            <h2>Editar divida</h2>
            <div className="form-grid">
              <TextArea
                label="Conteudo da restricao"
                value={debtContent(editingDebt)}
                onChange={(value) => updateDebtItem(editingDebt.id, { content: value, details: value, title: value })}
              />
              <SelectField label="Tipo" value={editingDebt.category || restrictionFilters[0]} options={restrictionFilters} onChange={(value) => updateDebtItem(editingDebt.id, { category: value })} />
              <SelectField label="Status" value={editingDebt.status} options={debtStatusOptions} onChange={(value) => updateDebtItem(editingDebt.id, { status: value })} />
            </div>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setEditingDebtId("")}>Cancelar</button>
              <button
                className={`primary-button ${isPending(`debt-${editingDebt.id}`) ? "action-busy" : ""}`}
                type="button"
                onClick={async () => {
                  await saveDebt(editingDebt);
                  setEditingDebtId("");
                }}
                disabled={disableActions}
              >
                <Save size={15} /> {isPending(`debt-${editingDebt.id}`) ? "Salvando..." : "Salvar divida"}
              </button>
            </div>
          </article>
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
            <button className={`primary-button ${isPending("credits") ? "action-busy" : ""}`} type="button" onClick={saveCredits} disabled={disableActions}><Save size={15} /> {isPending("credits") ? "Salvando..." : "Salvar creditos"}</button>
          </div>
        </div>
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
            <button className="secondary-button" type="button" onClick={() => setData((prev) => ({ ...prev, settings: { ...(prev.settings || {}), logoUrl: "" } }))} disabled={disableActions}>Remover logo</button>
            <button className={`primary-button ${isPending("settings") ? "action-busy" : ""}`} type="button" onClick={saveSettings} disabled={disableActions}><Save size={15} /> {isPending("settings") ? "Salvando..." : "Salvar configuracao"}</button>
          </div>
          <div className="snapshot-manager">
            <strong>Versoes salvas</strong>
            <div className="snapshot-save-row">
              <Field label="Nome da versao" value={snapshotName} onChange={setSnapshotName} />
              <button
                className={`primary-button ${isPending("snapshot-save") ? "action-busy" : ""}`}
                type="button"
                onClick={createSnapshotVersion}
                disabled={disableActions}
              >
                <Save size={15} /> {isPending("snapshot-save") ? "Salvando..." : "Salvar versao"}
              </button>
            </div>
            {snapshots.length === 0 ? (
              <p className="muted compact-muted">Nenhuma versao salva.</p>
            ) : (
              <div className="snapshot-list">
                {snapshots.map((snapshot) => (
                  <div className="snapshot-row" key={snapshot.id}>
                    <div>
                      <strong>{snapshot.name}</strong>
                      <span>{formatSnapshotDate(snapshot.createdAt)}</span>
                    </div>
                    <div className="snapshot-actions">
                      <button
                        className="secondary-button compact"
                        type="button"
                        onClick={() => loadSnapshotVersion(snapshot.id)}
                        disabled={disableActions}
                      >
                        {isPending(`snapshot-load-${snapshot.id}`) ? "Carregando..." : "Carregar"}
                      </button>
                      <button
                        className="danger-button compact"
                        type="button"
                        onClick={() => deleteSnapshotVersion(snapshot.id)}
                        disabled={disableActions}
                      >
                        {isPending(`snapshot-delete-${snapshot.id}`) ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  const [resolving, setResolving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setShowReasons(false);
    setCredentialReason("");
    setCredentials({ login: "", pin: "", password: "" });
    setResolving(false);
    setSuccessMessage("");

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [debt?.id]);

  if (!debt) return null;

  async function resolve(reason, credentialPayload = null) {
    if (resolving) return;
    setResolving(true);
    try {
      const updatedDebt = await api(`/admin/debts/${debt.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ reason, credentials: credentialPayload })
      }, token);
      setSuccessMessage(resolutionSuccessMessage);
      toast(resolutionSuccessMessage);
      onResolved(updatedDebt);
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        onClose();
      }, 1400);
    } finally {
      setResolving(false);
    }
  }

  function submitCredential(event) {
    event.preventDefault();
    resolve(credentialReason || "Quitacao", credentials);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <article className={`modal ${credentialReason ? "credential-theme" : ""}`} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>x</button>
        {successMessage ? (
          <div className="resolution-success">
            <strong>{successMessage}</strong>
          </div>
        ) : !credentialReason ? (
          <>
            <h2>{debt.category || "Restricao"}</h2>
            <p className="debt-content-text">{debtContent(debt)}</p>
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
              <button className="secondary-button" type="button" onClick={() => setCredentialReason("")} disabled={resolving}>Voltar</button>
              <button className={`success-button ${resolving ? "action-busy" : ""}`} type="submit" disabled={resolving}>{resolving ? "Confirmando..." : "Confirmar"}</button>
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
  const [snapshots, setSnapshots] = useState([]);

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

  async function refreshSnapshots() {
    if (!token) return;
    const list = await api(`/admin/profiles/${profileId}/snapshots`, {}, token);
    setSnapshots(list);
  }

  async function refreshDraftOnly() {
    if (!token) return;
    const panel = await api(`/panel/${profileId}`, {}, token);
    setData(panel);
    setPanelData(panel);
  }

  function logout() {
    setSession(null);
    setData(null);
    setPanelData(null);
    setSnapshots([]);
    setSelectedDebt(null);
    setCurrent("panel");
    setToastMessage("");
  }

  async function createSnapshot(name) {
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      toast("Informe o nome da versao");
      return;
    }
    const snapshot = await api(`/admin/profiles/${profileId}/snapshots`, {
      method: "POST",
      body: JSON.stringify({ name: cleanName })
    }, token);
    setSnapshots((prev) => [snapshot, ...prev]);
    toast("Versao salva");
  }

  async function loadSnapshot(snapshotId) {
    const restoredPanel = await api(`/admin/profiles/${profileId}/snapshots/${snapshotId}/load`, {
      method: "POST"
    }, token);
    setData(restoredPanel);
    setPanelData(restoredPanel);
    setCurrent("panel");
    await refreshSnapshots();
    toast("Versao carregada");
  }

  async function deleteSnapshot(snapshotId) {
    await api(`/admin/profiles/${profileId}/snapshots/${snapshotId}`, {
      method: "DELETE"
    }, token);
    setSnapshots((prev) => prev.filter((snapshot) => snapshot.id !== snapshotId));
    toast("Versao excluida");
  }

  useEffect(() => {
    refresh();
    refreshSnapshots();
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
      <Header settings={data.settings} onLogout={logout} />
      <Sidebar current={current} setCurrent={setCurrent} />
      <div className="workspace">
        {current === "panel" ? (
          <Preview data={panelData} onRefresh={refresh} refreshing={refreshing} onDebtSelect={setSelectedDebt} />
        ) : (
          <Editor
            current={current}
            data={data}
            setData={setData}
            setPanelData={setPanelData}
            token={token}
            refresh={refresh}
            toast={toast}
            onDebtSelect={setSelectedDebt}
            snapshots={snapshots}
            onCreateSnapshot={createSnapshot}
            onLoadSnapshot={loadSnapshot}
            onDeleteSnapshot={deleteSnapshot}
          />
        )}
      </div>
      {toastMessage && <div className="toast">{toastMessage}</div>}
      <DebtModal
        debt={selectedDebt}
        token={token}
        toast={toast}
        onRefresh={refreshDraftOnly}
        onResolved={(updatedDebt) => {
          const updateResolvedDebt = (prev) => ({
            ...prev,
            debts: (prev.debts || []).map((debt) => debt.id === updatedDebt.id ? updatedDebt : debt)
          });
          setData((prev) => ({
            ...prev,
            debts: (prev.debts || []).map((debt) => debt.id === updatedDebt.id ? updatedDebt : debt)
          }));
          setPanelData((prev) => prev ? updateResolvedDebt(prev) : prev);
        }}
        onClose={() => setSelectedDebt(null)}
      />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
