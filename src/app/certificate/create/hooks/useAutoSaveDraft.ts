'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { certificateStore, type PurposeType } from '@/lib/store';
import type { CertificateFormData } from '../types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 3000;
const SESSION_KEY = 'auto-save-draft-id';

export function useAutoSaveDraft(
  formData: CertificateFormData,
  isInitialized: boolean,
  userId: string | undefined,
) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Restore existing draft ID from sessionStorage on mount
  useEffect(() => {
    const existingId = sessionStorage.getItem(SESSION_KEY);
    if (existingId) {
      // Verify it still exists in IndexedDB
      certificateStore.getCertificate(existingId).then(cert => {
        if (cert) {
          setDraftId(existingId);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      });
    }
  }, []);

  const saveDraft = useCallback(async (data: CertificateFormData) => {
    // Don't save until purposeType is selected
    if (!data.purposeType) return;

    setSaveStatus('saving');
    try {
      const fullApplicantAddress = data.applicantAddress + (data.applicantAddressDetail || '');
      const currentDraftId = sessionStorage.getItem(SESSION_KEY);

      if (currentDraftId) {
        // Update existing draft
        await certificateStore.updateCertificate(currentDraftId, {
          applicantName: data.applicantName,
          applicantAddress: fullApplicantAddress,
          propertyNumber: data.propertyNumber,
          propertyAddress: data.propertyAddress,
          completionDate: data.completionDate,
          purposeType: data.purposeType as PurposeType,
          status: 'draft',
        });
        setDraftId(currentDraftId);
      } else {
        // Create new draft
        const cert = await certificateStore.createCertificate(
          data.purposeType as PurposeType,
          userId,
        );
        await certificateStore.updateCertificate(cert.id, {
          applicantName: data.applicantName,
          applicantAddress: fullApplicantAddress,
          propertyNumber: data.propertyNumber,
          propertyAddress: data.propertyAddress,
          completionDate: data.completionDate,
          status: 'draft',
        });
        sessionStorage.setItem(SESSION_KEY, cert.id);
        setDraftId(cert.id);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Auto-save draft failed:', err);
      setSaveStatus('error');
    }
  }, [userId]);

  // Debounced auto-save on formData changes
  useEffect(() => {
    if (!isInitialized) return;
    // Skip the first render to avoid saving initial/restored data immediately
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      saveDraft(formData);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [formData, isInitialized, saveDraft]);

  const saveDraftNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    return saveDraft(formData);
  }, [formData, saveDraft]);

  const clearDraftSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setDraftId(null);
    setSaveStatus('idle');
  }, []);

  return { draftId, saveStatus, saveDraftNow, clearDraftSession };
}
