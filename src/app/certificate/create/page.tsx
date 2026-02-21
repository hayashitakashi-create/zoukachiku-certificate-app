'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { IssuerInfo } from '@/types/issuer';
import IssuerInfoForm from '@/components/issuer/IssuerInfoForm';
import { convertFormStateToWorkData } from '@/components/CostCalculationStep';
import { certificateStore, type PurposeType } from '@/lib/store';
import {
  type WizardStep,
  type CertificateFormData,
  type ReformTaxCostForm,
  PURPOSE_WORK_TYPES,
  defaultReformTaxWorkTypeForm,
  defaultReformTaxCostForm,
  defaultPropertyTaxForm,
} from './types';
import { executeSaveCertificate } from './saveCertificate';
import { useAutoSaveDraft } from './hooks/useAutoSaveDraft';
import SaveStatusIndicator from './components/SaveStatusIndicator';
import Step1BasicInfo from './components/Step1BasicInfo';
import Step2WorkTypes from './components/Step2WorkTypes';
import Step3WorkDescription from './components/Step3WorkDescription';
import Step4CostDetails from './components/Step4CostDetails';
import Step6Confirmation from './components/Step6Confirmation';

export default function CertificateCreatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [wasRestored, setWasRestored] = useState(false);
  // 編集モード: URLの ?id= パラメータから既存証明書IDを取得
  const [editingId, setEditingId] = useState<string | null>(null);

  // 初期値
  const initialFormData: CertificateFormData = {
    applicantName: '',
    applicantPostalCode: '',
    applicantAddress: '',
    applicantAddressDetail: '',
    propertyNumber: '',
    propertyPostalCode: '',
    propertyAddress: '',
    propertyAddressDetail: '',
    completionDate: '',
    purposeType: '',
    selectedWorkTypes: [],
    housingLoanWorkTypes: {},
    reformTaxWorkTypes: { ...defaultReformTaxWorkTypeForm },
    propertyTaxForm: { ...defaultPropertyTaxForm },
    workDataForm: {},
    reformTaxCost: { ...defaultReformTaxCostForm },
    housingLoanCost: { totalCost: 0, hasSubsidy: false, subsidyAmount: 0 },
    workDescriptions: {},
    issuerInfo: null,
    issueDate: new Date().toISOString().split('T')[0],
  };

  const [formData, setFormData] = useState<CertificateFormData>(initialFormData);

  // IndexedDB 自動保存フック
  const { draftId, saveStatus, clearDraftSession } = useAutoSaveDraft(
    formData,
    isInitialized,
    session?.user?.id,
    editingId,
  );

  // ローカルストレージ or IndexedDB から下書きと証明者設定を復元（初回のみ）
  useEffect(() => {
    // URLから編集IDを読み取り
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');
    if (editId) {
      setEditingId(editId);
    }

    // === 編集モード: IndexedDB から既存証明書を読み込む ===
    if (editId) {
      certificateStore.getCertificate(editId).then(cert => {
        if (!cert) {
          console.error('Certificate not found:', editId);
          setIsInitialized(true);
          return;
        }

        if (cert.formDataSnapshot) {
          // スナップショットから完全復元（defaults とのマージで後方互換性を確保）
          const parsed = { ...cert.formDataSnapshot };
          if (!parsed.workDataForm) parsed.workDataForm = {};
          if (!parsed.workDescriptions) parsed.workDescriptions = {};
          if (!parsed.selectedWorkTypes) parsed.selectedWorkTypes = [];
          if (!parsed.housingLoanWorkTypes) parsed.housingLoanWorkTypes = {};
          // reformTaxWorkTypes: deep merge with defaults
          {
            const def = defaultReformTaxWorkTypeForm;
            const rt = parsed.reformTaxWorkTypes || {};
            parsed.reformTaxWorkTypes = {
              seismic: { ...def.seismic, ...rt.seismic },
              barrierFree: { ...def.barrierFree, ...rt.barrierFree },
              energySaving: {
                ...def.energySaving,
                ...rt.energySaving,
                lowCarbon: { ...def.energySaving.lowCarbon, ...(rt.energySaving?.lowCarbon || {}) },
                equipmentTypes: { ...def.energySaving.equipmentTypes, ...(rt.energySaving?.equipmentTypes || {}) },
                additionalWorks: { ...def.energySaving.additionalWorks, ...(rt.energySaving?.additionalWorks || {}) },
              },
              cohabitation: {
                ...def.cohabitation,
                ...rt.cohabitation,
                countBefore: { ...def.cohabitation.countBefore, ...(rt.cohabitation?.countBefore || {}) },
                countAfter: { ...def.cohabitation.countAfter, ...(rt.cohabitation?.countAfter || {}) },
              },
              longTermHousing: { ...def.longTermHousing, ...rt.longTermHousing },
              childcare: { ...def.childcare, ...rt.childcare },
              additionalWorks: {
                work1: { ...def.additionalWorks.work1, ...(rt.additionalWorks?.work1 || {}) },
                work2: { ...def.additionalWorks.work2, ...(rt.additionalWorks?.work2 || {}) },
                work3: { ...def.additionalWorks.work3, ...(rt.additionalWorks?.work3 || {}) },
                work4: { ...def.additionalWorks.work4, ...(rt.additionalWorks?.work4 || {}) },
                work5: { ...def.additionalWorks.work5, ...(rt.additionalWorks?.work5 || {}) },
                work6: { ...def.additionalWorks.work6, ...(rt.additionalWorks?.work6 || {}) },
              },
            };
          }
          // reformTaxCost: deep merge
          {
            const def = defaultReformTaxCostForm;
            const rc = parsed.reformTaxCost || {};
            parsed.reformTaxCost = {
              seismic: { ...def.seismic, ...rc.seismic },
              barrierFree: { ...def.barrierFree, ...rc.barrierFree },
              energySaving: { ...def.energySaving, ...rc.energySaving },
              cohabitation: { ...def.cohabitation, ...rc.cohabitation },
              longTermOr: { ...def.longTermOr, ...(rc.longTermOr || {}) },
              longTermAnd: { ...def.longTermAnd, ...(rc.longTermAnd || {}) },
              childcare: { ...def.childcare, ...rc.childcare },
              otherRenovation: { ...def.otherRenovation, ...rc.otherRenovation },
            };
          }
          if (!parsed.propertyTaxForm) parsed.propertyTaxForm = { ...defaultPropertyTaxForm };
          if (!parsed.housingLoanCost) parsed.housingLoanCost = { totalCost: 0, hasSubsidy: false, subsidyAmount: 0 };
          setFormData(parsed);
        } else {
          // スナップショットなし（旧データ）: Certificate からベストエフォート復元
          const loaded: CertificateFormData = {
            ...initialFormData,
            applicantName: cert.applicantName,
            applicantAddress: cert.applicantAddress,
            propertyNumber: cert.propertyNumber,
            propertyAddress: cert.propertyAddress,
            completionDate: cert.completionDate,
            purposeType: cert.purposeType,
            workDescriptions: cert.workDescriptions || {},
            issuerInfo: cert.issuerInfo || null,
            issueDate: cert.issueDate,
          };
          // housing_loan / resale: 詳細データを復元
          if (cert.housingLoanDetail) {
            loaded.housingLoanWorkTypes = cert.housingLoanDetail.workTypes || {};
            loaded.housingLoanCost = {
              totalCost: cert.housingLoanDetail.totalCost,
              hasSubsidy: cert.housingLoanDetail.hasSubsidy,
              subsidyAmount: cert.housingLoanDetail.subsidyAmount,
            };
          }
          // reform_tax: 費用データを部分復元
          if (cert.reformTaxDetail) {
            const rd = cert.reformTaxDetail;
            const toCostCat = (d: { totalAmount: number; subsidyAmount: number } | undefined) =>
              d ? { totalAmount: d.totalAmount, hasSubsidy: d.subsidyAmount > 0, subsidyAmount: d.subsidyAmount } : { ...defaultReformTaxCostForm.seismic };
            loaded.reformTaxCost = {
              ...defaultReformTaxCostForm,
              seismic: toCostCat(rd.seismic),
              barrierFree: toCostCat(rd.barrierFree),
              energySaving: { ...toCostCat(rd.energySaving), hasSolarPower: rd.energySaving?.hasSolarPower || false },
              cohabitation: toCostCat(rd.cohabitation),
              childcare: toCostCat(rd.childcare),
              otherRenovation: toCostCat(rd.otherRenovation),
            };
          }
          setFormData(loaded);
        }
        setIsInitialized(true);
      }).catch(err => {
        console.error('Failed to load certificate for editing:', err);
        setIsInitialized(true);
      });
      return;
    }

    // === 新規作成モード: ローカルストレージから復元 ===
    let currentSessionId = sessionStorage.getItem('certificate-session-id');
    if (!currentSessionId) {
      currentSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('certificate-session-id', currentSessionId);
    }

    const FORM_SCHEMA_VERSION = 3; // v3: work6 B/C/D pattern separation
    const savedData = localStorage.getItem('certificate-form-data');
    let loadedFormData: CertificateFormData | null = null;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // スキーマバージョンが古い場合は旧データを破棄
        if ((parsed._schemaVersion || 0) < FORM_SCHEMA_VERSION) {
          console.log('Form schema upgraded: clearing incompatible draft data');
          localStorage.removeItem('certificate-form-data');
          // loadedFormData = null のまま → デフォルトで初期化
        } else {
        if (parsed.sessionId && parsed.sessionId !== currentSessionId) {
          setWasRestored(true);
        }
        // 旧データとの互換
        if (!parsed.workDataForm) parsed.workDataForm = {};
        if (!parsed.workDescriptions) parsed.workDescriptions = {};
        if (!parsed.selectedWorkTypes) parsed.selectedWorkTypes = [];
        if (!parsed.housingLoanWorkTypes) parsed.housingLoanWorkTypes = {};
        // reformTaxWorkTypes: deep merge with defaults to handle new nested structures
        {
          const def = defaultReformTaxWorkTypeForm;
          const rt = parsed.reformTaxWorkTypes || {};
          parsed.reformTaxWorkTypes = {
            seismic: { ...def.seismic, ...rt.seismic },
            barrierFree: { ...def.barrierFree, ...rt.barrierFree },
            energySaving: {
              ...def.energySaving,
              ...rt.energySaving,
              lowCarbon: { ...def.energySaving.lowCarbon, ...(rt.energySaving?.lowCarbon || {}) },
              equipmentTypes: { ...def.energySaving.equipmentTypes, ...(rt.energySaving?.equipmentTypes || {}) },
              additionalWorks: { ...def.energySaving.additionalWorks, ...(rt.energySaving?.additionalWorks || {}) },
            },
            cohabitation: {
              ...def.cohabitation,
              ...rt.cohabitation,
              countBefore: { ...def.cohabitation.countBefore, ...(rt.cohabitation?.countBefore || {}) },
              countAfter: { ...def.cohabitation.countAfter, ...(rt.cohabitation?.countAfter || {}) },
            },
            longTermHousing: { ...def.longTermHousing, ...rt.longTermHousing },
            childcare: { ...def.childcare, ...rt.childcare },
            additionalWorks: {
              work1: { ...def.additionalWorks.work1, ...(rt.additionalWorks?.work1 || {}) },
              work2: { ...def.additionalWorks.work2, ...(rt.additionalWorks?.work2 || {}) },
              work3: { ...def.additionalWorks.work3, ...(rt.additionalWorks?.work3 || {}) },
              work4: { ...def.additionalWorks.work4, ...(rt.additionalWorks?.work4 || {}) },
              work5: { ...def.additionalWorks.work5, ...(rt.additionalWorks?.work5 || {}) },
              work6: { ...def.additionalWorks.work6, ...(rt.additionalWorks?.work6 || {}) },
            },
          };
        }
        // reformTaxCost: deep merge with defaults for new compound structures
        {
          const def = defaultReformTaxCostForm;
          const rc = parsed.reformTaxCost || {};
          parsed.reformTaxCost = {
            seismic: { ...def.seismic, ...rc.seismic },
            barrierFree: { ...def.barrierFree, ...rc.barrierFree },
            energySaving: { ...def.energySaving, ...rc.energySaving },
            cohabitation: { ...def.cohabitation, ...rc.cohabitation },
            longTermOr: { ...def.longTermOr, ...(rc.longTermOr || {}) },
            longTermAnd: { ...def.longTermAnd, ...(rc.longTermAnd || {}) },
            childcare: { ...def.childcare, ...rc.childcare },
            otherRenovation: { ...def.otherRenovation, ...rc.otherRenovation },
          };
        }
        if (!parsed.propertyTaxForm) parsed.propertyTaxForm = { ...defaultPropertyTaxForm };
        if (!parsed.housingLoanCost) parsed.housingLoanCost = { totalCost: 0, hasSubsidy: false, subsidyAmount: 0 };
        loadedFormData = parsed;
        } // end else (schema version OK)
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }

    // 証明者設定を読み込む（API優先、localStorageフォールバック）
    // fromApi=true の場合、issuerInfoがnullでもloadedFormDataの値を上書きする（他ユーザーのデータ漏洩防止）
    const applyIssuerSettings = (issuerSettings: Partial<IssuerInfo> | null, fromApi: boolean) => {
      if (loadedFormData) {
        if (fromApi) {
          // 認証済み → APIの結果で常に上書き（nullでも上書きして前ユーザーのデータを消す）
          setFormData({ ...loadedFormData, issuerInfo: issuerSettings });
        } else if (issuerSettings && (!loadedFormData.issuerInfo || !loadedFormData.issuerInfo.organizationType)) {
          setFormData({ ...loadedFormData, issuerInfo: issuerSettings });
        } else {
          setFormData(loadedFormData);
        }
      } else if (issuerSettings) {
        setFormData(prev => ({ ...prev, issuerInfo: issuerSettings }));
      }
    };

    const loadIssuerSettings = async () => {
      try {
        const res = await fetch('/api/issuer-settings');
        if (res.ok) {
          // 認証済み → DB結果を信頼（nullでもlocalStorageにフォールバックしない）
          const data = await res.json();
          applyIssuerSettings(data.issuerInfo ?? null, true);
          // 他ユーザーのデータ漏洩防止のためlocalStorageをクリア
          localStorage.removeItem('issuer-settings');
          setIsInitialized(true);
          return;
        }
        if (res.status !== 401) {
          // 401以外のエラー → フォールバックせず終了
          if (loadedFormData) setFormData(loadedFormData);
          setIsInitialized(true);
          return;
        }
        // 401（未認証）→ 下のlocalStorageフォールバックへ
      } catch {
        // ネットワークエラー → 下のlocalStorageフォールバックへ
      }

      // 未認証またはネットワークエラー時のみlocalStorageから読み込み
      const savedSettings = localStorage.getItem('issuer-settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          let issuerSettings: Partial<IssuerInfo> | null = null;
          if (settings.issuerName && !settings.organizationType) {
            issuerSettings = {
              organizationType: 'registered_architect_office',
              architectName: settings.issuerName || '',
              officeName: settings.issuerOfficeName || '',
              architectRegistrationNumber: settings.issuerQualificationNumber || '',
            } as any;
          } else {
            issuerSettings = settings;
          }
          applyIssuerSettings(issuerSettings, false);
        } catch (error) {
          console.error('Failed to parse issuer settings:', error);
          if (loadedFormData) setFormData(loadedFormData);
        }
      } else if (loadedFormData) {
        setFormData(loadedFormData);
      }
      setIsInitialized(true);
    };

    loadIssuerSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フォームデータが変更されたらlocalStorageに自動保存
  useEffect(() => {
    if (isInitialized) {
      const currentSessionId = sessionStorage.getItem('certificate-session-id');
      localStorage.setItem('certificate-form-data', JSON.stringify({
        ...formData,
        sessionId: currentSessionId,
        _schemaVersion: 3,
      }));
    }
  }, [formData, isInitialized]);

  // URLクエリからステップを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      const step = parseInt(stepParam) as WizardStep;
      if (step >= 1 && step <= 6) setCurrentStep(step);
    }
  }, []);

  // 計算ページからの結果をlocalStorageから取り込む
  // ※ isInitialized が true になるまで実行しない（初期化中に実行すると
  //    localStorage のキーを消費した後、初期化完了時に formData が上書きされてしまう）
  const applyCalcResults = useCallback(() => {
    if (!isInitialized) return;

    const lsKeyMap: Record<string, 'seismic' | 'barrierFree' | 'energySaving' | 'cohabitation' | 'childcare' | 'otherRenovation'> = {
      calc_result_seismic: 'seismic',
      calc_result_barrierFree: 'barrierFree',
      calc_result_energySaving: 'energySaving',
      calc_result_cohabitation: 'cohabitation',
      calc_result_childcare: 'childcare',
      calc_result_otherRenovation: 'otherRenovation',
    };

    let updated = false;

    setFormData(prev => {
      const costUpdates: Partial<ReformTaxCostForm> = {};

      for (const [lsKey, category] of Object.entries(lsKeyMap)) {
        const val = localStorage.getItem(lsKey);
        if (val !== null) {
          const amount = Math.max(0, parseInt(val) || 0);
          const subsidyKey = `calc_subsidy_${category}`;
          const subsidyVal = localStorage.getItem(subsidyKey);
          const subsidyAmount = subsidyVal !== null ? Math.max(0, parseInt(subsidyVal) || 0) : 0;
          (costUpdates as Record<string, unknown>)[category] = {
            ...prev.reformTaxCost[category as keyof ReformTaxCostForm],
            totalAmount: amount,
            ...(subsidyAmount > 0 ? { hasSubsidy: true, subsidyAmount } : {}),
          };
          localStorage.removeItem(lsKey);
          if (subsidyVal !== null) localStorage.removeItem(subsidyKey);
          updated = true;
        }
      }

      // longTermHousing → longTermOr.durabilityTotalAmount に反映
      const lthVal = localStorage.getItem('calc_result_longTermHousing');
      if (lthVal !== null) {
        const amount = Math.max(0, parseInt(lthVal) || 0);
        const lthSubsidyVal = localStorage.getItem('calc_subsidy_longTermHousing');
        const lthSubsidy = lthSubsidyVal !== null ? Math.max(0, parseInt(lthSubsidyVal) || 0) : 0;
        costUpdates.longTermOr = {
          ...prev.reformTaxCost.longTermOr,
          durabilityTotalAmount: amount,
          ...(lthSubsidy > 0 ? { durabilityHasSubsidy: true, durabilitySubsidyAmount: lthSubsidy } : {}),
        };
        localStorage.removeItem('calc_result_longTermHousing');
        if (lthSubsidyVal !== null) localStorage.removeItem('calc_subsidy_longTermHousing');
        updated = true;
      }

      if (!updated) return prev;
      return { ...prev, reformTaxCost: { ...prev.reformTaxCost, ...costUpdates } };
    });
  }, [isInitialized]);

  // ページ表示時・フォーカス復帰時に計算結果を取り込む
  useEffect(() => {
    applyCalcResults();
    window.addEventListener('focus', applyCalcResults);
    return () => window.removeEventListener('focus', applyCalcResults);
  }, [applyCalcResults]);

  const steps = [
    { number: 1, title: '基本情報', description: '申請者・物件情報' },
    { number: 2, title: '(1) 工事種別', description: '実施した工事の種別' },
    { number: 3, title: '(2) 工事内容', description: '実施した工事の内容' },
    { number: 4, title: '(3) 費用の額', description: '工事の費用の額等' },
    { number: 5, title: '証明者情報', description: '発行者情報' },
    { number: 6, title: '確認・保存', description: 'プレビューと保存' },
  ];

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      if (!formData.applicantName || !formData.applicantAddress || !formData.propertyAddress ||
          !formData.completionDate || !formData.purposeType) {
        alert('基本情報の必須項目を入力してください');
        return;
      }
    }
    if (currentStep === 5) {
      if (!formData.issueDate) {
        alert('発行日を入力してください');
        return;
      }
      if (!formData.issuerInfo?.organizationType) {
        alert('証明者の組織種別を選択してください');
        return;
      }
      if (!formData.issuerInfo?.architectName) {
        alert('建築士の氏名を入力してください');
        return;
      }
    }
    setCurrentStep(prev => (prev < 6 ? (prev + 1) as WizardStep : prev));
  }, [currentStep, formData]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => (prev > 1 ? (prev - 1) as WizardStep : prev));
  }, []);

  const handleNewForm = useCallback(() => {
    if (confirm('入力中のデータをクリアして新規作成を開始しますか？')) {
      localStorage.removeItem('certificate-form-data');
      const newSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('certificate-session-id', newSessionId);
      clearDraftSession();
      setFormData(initialFormData);
      setCurrentStep(1);
      setWasRestored(false);
    }
  }, [initialFormData, clearDraftSession]);

  // 費用サマリー（確認画面用）
  const getCostSummary = useCallback(() => {
    const workData = convertFormStateToWorkData(formData.workDataForm);
    let totalAmount = 0;
    let totalSubsidy = 0;
    const details: { label: string; total: number; subsidy: number }[] = [];

    const labels: Record<string, string> = {
      seismic: '耐震改修', barrierFree: 'バリアフリー改修', energySaving: '省エネ改修',
      cohabitation: '同居対応改修', childcare: '子育て対応改修',
      longTermHousing: '長期優良住宅化改修', otherRenovation: 'その他増改築',
    };

    for (const [cat, data] of Object.entries(workData)) {
      if (data.summary && data.summary.totalAmount > 0) {
        details.push({
          label: labels[cat] || cat,
          total: data.summary.totalAmount,
          subsidy: data.summary.subsidyAmount,
        });
        totalAmount += data.summary.totalAmount;
        totalSubsidy += data.summary.subsidyAmount;
      }
    }

    return { totalAmount, totalSubsidy, details };
  }, [formData.workDataForm]);

  // 用途に応じた工事種別一覧（selectedWorkTypesの代わりに使用）
  const effectiveWorkTypes = useMemo(() => {
    if (!formData.purposeType) return [];
    return PURPOSE_WORK_TYPES[formData.purposeType as PurposeType] || [];
  }, [formData.purposeType]);

  // IndexedDBに保存
  const saveCertificate = async (status: 'draft' | 'completed') => {
    setIsSaving(true);
    try {
      await executeSaveCertificate(formData, status, session?.user?.id, editingId || draftId || undefined);

      // ローカルストレージの下書きをクリア
      localStorage.removeItem('certificate-form-data');
      const newSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('certificate-session-id', newSessionId);
      clearDraftSession();
      setWasRestored(false);

      alert(status === 'draft' ? '下書きを保存しました' : '証明書を保存しました');
      // 編集モードの場合は証明書詳細ページに戻る
      router.push(editingId ? `/certificate/${editingId}` : '/');
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">
              増改築等工事証明書 {editingId ? '編集' : '作成'}
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleNewForm}
                className="px-4 py-2 text-sm text-stone-700 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors"
              >
                クリア
              </button>
              <Link href="/" className="px-4 py-2 text-sm text-amber-700 hover:text-amber-800 font-semibold">
                トップに戻る
              </Link>
            </div>
          </div>
        </div>

        {/* ステップインジケーター */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-3 sm:p-4 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => goToStep(step.number as WizardStep)}
                  className={`flex flex-col items-center ${currentStep >= step.number ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div className={`w-8 h-8 text-xs sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold sm:text-sm transition-all ${
                    currentStep === step.number ? 'bg-gradient-to-r from-amber-700 to-stone-700 text-white shadow-lg shadow-amber-900/20'
                    : currentStep > step.number ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-500'
                  }`}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <p className="mt-1 text-xs font-medium">{step.title}</p>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${currentStep > step.number ? 'bg-emerald-500' : 'bg-stone-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <SaveStatusIndicator status={saveStatus} />
          </div>
        </div>

        {/* コンテンツ */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6">
          {/* ステップ1: 基本情報 */}
          {currentStep === 1 && (
            <Step1BasicInfo formData={formData} setFormData={setFormData} wasRestored={wasRestored} />
          )}

          {/* ステップ2: (1) 実施した工事の種別（公式様式 第1号～第6号） */}
          {currentStep === 2 && (
            <Step2WorkTypes formData={formData} setFormData={setFormData} />
          )}

          {/* ステップ3: (2) 実施した工事の内容 */}
          {currentStep === 3 && (
            <Step3WorkDescription formData={formData} setFormData={setFormData} />
          )}

          {/* ステップ4: (3) 実施した工事の費用の額等 */}
          {currentStep === 4 && (
            <Step4CostDetails formData={formData} setFormData={setFormData} effectiveWorkTypes={effectiveWorkTypes} />
          )}

          {/* ステップ5: 証明者情報 */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-bold mb-4">証明者情報</h2>
              <IssuerInfoForm
                issuerInfo={formData.issuerInfo}
                onChange={(newIssuerInfo) => setFormData(prev => ({ ...prev, issuerInfo: newIssuerInfo }))}
              />
              <div className="mt-6 pt-4 border-t">
                <label className="block text-sm font-medium text-stone-700 mb-1">発行日 *</label>
                <input type="date" value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  className="max-w-md w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors" />
              </div>
            </div>
          )}

          {/* ステップ6: 確認・保存 */}
          {currentStep === 6 && (
            <Step6Confirmation
              formData={formData}
              setFormData={setFormData}
              goToStep={goToStep}
              saveCertificate={saveCertificate}
              isSaving={isSaving}
              getCostSummary={getCostSummary}
              effectiveWorkTypes={effectiveWorkTypes}
            />
          )}
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-6">
          <button type="button" onClick={prevStep} disabled={currentStep === 1}
            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-stone-200 text-stone-700 rounded-full hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
            前へ
          </button>
          <button type="button" onClick={nextStep} disabled={currentStep === 6}
            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white rounded-full shadow-xl shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:scale-105 disabled:hover:scale-100">
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
