import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfileApi, changePasswordApi } from '../services/api';
import { maskPhoneInput, maskCNPJInput, formatPhone, formatCNPJ } from '../utils/formatters';
import { User as UserIcon, Building2, Phone, Mail, MapPin, FileText, Image as ImageIcon, KeyRound, Save, Upload, Trash2, CheckCircle2, ShieldCheck, Lock, FileCode2 } from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';

interface MeuPerfilPageProps {
  navigate: (path: string) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

export const MeuPerfilPage: React.FC<MeuPerfilPageProps> = ({ navigate, addToast }) => {
  const { user, updateUser } = useAuth();

  // Profile Form State
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [razaoSocial, setRazaoSocial] = useState(user?.razaoSocial || '');
  const [nomeFantasia, setNomeFantasia] = useState(user?.nomeFantasia || '');
  const [endereco, setEndereco] = useState(user?.endereco || '');
  const [telefone, setTelefone] = useState(maskPhoneInput(user?.telefone || ''));
  const [cnpj, setCnpj] = useState(maskCNPJInput(user?.cnpj || ''));
  const [logomarca, setLogomarca] = useState<string>(user?.logomarca || '');

  // Rich Text Default Fields for Budgets
  const [introducao, setIntroducao] = useState(user?.introducao || '');
  const [materiaPrima, setMateriaPrima] = useState(user?.materiaPrima || '');
  const [formaPagamento, setFormaPagamento] = useState(user?.formaPagamento || '');

  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Modal / Section state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Erro no arquivo', 'error', 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Arquivo muito grande', 'error', 'A logomarca deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogomarca(reader.result);
        addToast('Logomarca selecionada', 'info', 'A nova imagem de logomarca foi pré-carregada. Clique em "Salvar Alterações" para aplicar.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogomarca('');
    addToast('Logomarca removida', 'info', 'Clique em "Salvar Alterações" para confirmar a remoção.');
  };

  // Submit Profile Form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      addToast('Campos obrigatórios', 'error', 'Nome e E-mail são obrigatórios.');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await updateUserProfileApi({
        nome,
        email,
        razaoSocial,
        nomeFantasia,
        endereco,
        telefone,
        cnpj,
        logomarca,
        introducao,
        materiaPrima,
        formaPagamento
      });

      updateUser(updatedUser);
      addToast('Perfil Atualizado!', 'success', 'As informações do seu perfil foram salvas com sucesso.');
    } catch (err: any) {
      addToast('Erro ao atualizar', 'error', err.message || 'Não foi possível salvar os dados.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change Form (Django DRF compatible flow)
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword) {
      addToast('Senha atual obrigatória', 'error', 'Por favor, informe sua senha atual.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      addToast('Nova senha inválida', 'error', 'A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('Senhas não conferem', 'error', 'A confirmação da nova senha não coincide com a senha digitada.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changePasswordApi(oldPassword, newPassword);
      addToast('Senha Alterada!', 'success', res.message || 'Sua senha foi redefinida com sucesso.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
    } catch (err: any) {
      addToast('Erro na alteração', 'error', err.message || 'Erro ao redefinir a senha.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm overflow-hidden flex-shrink-0">
            {logomarca ? (
              <img src={logomarca} alt="Logomarca da Empresa" className="w-full h-full object-contain p-1" />
            ) : (
              <Building2 className="w-8 h-8" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{nomeFantasia || user?.nome || 'Meu Perfil'}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{razaoSocial || user?.email || 'Gerencie as informações da sua conta e empresa'}</p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 font-mono">
              {cnpj && <span><strong>CNPJ:</strong> {formatCNPJ(cnpj)}</span>}
              {telefone && <span>• <strong>Tel:</strong> {formatPhone(telefone)}</span>}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition-all cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5 text-orange-400" />
          Alterar Senha
        </button>
      </div>

      {/* Profile Form Card */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-orange-600" />
              Dados do Usuário e da Empresa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Atualize as informações que aparecerão nos orçamentos e relatórios gerados.
            </p>
          </div>
        </div>

        {/* Logomarca Upload Section */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Logomarca da Empresa (Arquivo de Imagem)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-white border border-slate-300 flex items-center justify-center p-2 shadow-sm relative group overflow-hidden">
              {logomarca ? (
                <img src={logomarca} alt="Preview Logomarca" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-slate-400 space-y-1">
                  <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                  <span className="text-[10px] block font-medium">Sem imagem</span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <p className="text-xs text-slate-600">
                Selecione uma imagem para ser exibida nos seus orçamentos impressos e em PDF.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm transition-colors">
                  <Upload className="w-3.5 h-3.5 text-orange-600" />
                  Carregar Imagem
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {logomarca && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Formatos aceitos: PNG, JPG, WEBP, SVG (máx. 5MB)
              </span>
            </div>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nome do Responsável <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              E-mail de Acesso <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contato@empresa.com.br"
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Razão Social */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Razão Social
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Ex: OrcaMaster Soluções Ltda."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Nome Fantasia */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nome Fantasia
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                placeholder="Ex: OrcaMaster Engenharia"
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>

          {/* CNPJ */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              CNPJ (Máscara Padrão)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(maskCNPJInput(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Formato: 00.000.000/0000-00</span>
          </div>

          {/* Telefone */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Telefone / Comercial (Máscara Padrão)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(maskPhoneInput(e.target.value))}
                placeholder="(11) 98765-4321"
                maxLength={15}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Formato padrão: (**) *****-****</span>
          </div>

          {/* Endereço */}
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Endereço Completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* DEFAULT VALUES FOR BUDGETS SECTION (RICH TEXT EDITORS) */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-orange-600" />
              Valores Padrão para Novos Orçamentos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina os textos padrão de Introdução, Matéria Prima e Formas de Pagamento. Ao criar um novo orçamento, esses valores serão pré-carregados automaticamente.
            </p>
          </div>

          <div className="space-y-4">
            {/* Introdução Padrão */}
            <RichTextEditor
              id="profile-default-introducao"
              label="1. Introdução Padrão do Orçamento"
              value={introducao}
              onChange={setIntroducao}
              placeholder="Escreva a introdução padrão que aparecerá nos seus orçamentos..."
            />

            {/* Matéria Prima Padrão */}
            <RichTextEditor
              id="profile-default-materia-prima"
              label="2. Matéria Prima / Especificações Padrão"
              value={materiaPrima}
              onChange={setMateriaPrima}
              placeholder="Descreva o padrão de matéria-prima, marcas de ferragens e padrão de acabamento..."
            />

            {/* Formas de Pagamento Padrão */}
            <RichTextEditor
              id="profile-default-forma-pagamento"
              label="3. Formas de Pagamento Padrão"
              value={formaPagamento}
              onChange={setFormaPagamento}
              placeholder="Defina as condições padrão de pagamento (ex: parcelamento no cartão, desconto à vista)..."
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Voltar ao Painel
          </button>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2 bg-orange-400 hover:bg-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {savingProfile ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </button>
        </div>
      </form>

      {/* Django DRF Compatible Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Alterar Senha de Acesso</h3>
                  <p className="text-[11px] text-slate-400">Fluxo padrão compatível com Django DRF</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p>
                  Sua nova senha deve ter no mínimo 6 caracteres. Para segurança, informe a senha atual antes de prosseguir.
                </p>
              </div>

              {/* Senha Atual */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Senha Atual (old_password) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Nova Senha */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Nova Senha (new_password) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Confirmar Nova Senha */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Confirmar Nova Senha <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-orange-400 hover:bg-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {changingPassword ? (
                    <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirmar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
