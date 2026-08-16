import crypto from 'crypto';
import BlockchainTransaction from '../models/BlockchainTransaction.js';
import MedicalRecord from '../models/MedicalRecord.js';
import { BlockchainTx, IBlockchainTransaction } from '../types/index.js';

export interface DocumentUploadPayload {
  recordId: string;
  hash: string;
  actorId: string;
  patientId: string;
}

export interface AccessEventPayload {
  requestId: string;
  actorId: string;
  patientId: string;
  doctorId: string;
}

export interface DocumentAccessPayload {
  recordId: string;
  hash: string;
  actorId: string;
  patientId: string;
}

export interface VerifyResult {
  matches: boolean;
  storedHash: string;
  currentHash: string;
  transaction?: BlockchainTx;
}

export interface BlockchainService {
  recordDocumentUpload(payload: DocumentUploadPayload): Promise<BlockchainTx>;
  recordAccessRequest(payload: AccessEventPayload): Promise<BlockchainTx>;
  recordAccessApproval(payload: AccessEventPayload): Promise<BlockchainTx>;
  recordAccessRevocation(payload: AccessEventPayload): Promise<BlockchainTx>;
  recordDocumentAccess(payload: DocumentAccessPayload): Promise<BlockchainTx>;
  verifyDocument(recordId: string): Promise<VerifyResult>;
  getTransaction(txId: string): Promise<BlockchainTx | null>;
}

function toTx(doc: IBlockchainTransaction): BlockchainTx {
  return {
    txId: doc.txId,
    action: doc.action,
    hash: doc.hash,
    actorId: doc.actorId.toString(),
    patientId: doc.patientId?.toString(),
    recordId: doc.recordId?.toString(),
    requestId: doc.requestId?.toString(),
    details: doc.details,
    timestamp: doc.timestamp,
    status: doc.status
  };
}

async function persist(doc: Partial<IBlockchainTransaction>): Promise<BlockchainTx> {
  const saved = await BlockchainTransaction.create(doc);
  return toTx(saved);
}

export const blockchainService: BlockchainService = {
  async recordDocumentUpload({ recordId, hash, actorId, patientId }) {
    return persist({
      txId: crypto.randomUUID(),
      action: 'document_upload',
      hash,
      actorId: actorId as any,
      patientId: patientId as any,
      recordId: recordId as any,
      details: 'Medical record hash anchored to ledger',
      timestamp: new Date(),
      status: 'verified'
    });
  },

  async recordAccessRequest({ requestId, actorId, patientId, doctorId }) {
    return persist({
      txId: crypto.randomUUID(),
      action: 'access_request',
      actorId: actorId as any,
      patientId: patientId as any,
      requestId: requestId as any,
      details: `Access requested for patient ${patientId} by doctor ${doctorId}`,
      timestamp: new Date(),
      status: 'recorded'
    });
  },

  async recordAccessApproval({ requestId, actorId, patientId, doctorId }) {
    return persist({
      txId: crypto.randomUUID(),
      action: 'access_approval',
      actorId: actorId as any,
      patientId: patientId as any,
      requestId: requestId as any,
      details: `Access approved for patient ${patientId} by doctor ${doctorId}`,
      timestamp: new Date(),
      status: 'recorded'
    });
  },

  async recordAccessRevocation({ requestId, actorId, patientId, doctorId }) {
    return persist({
      txId: crypto.randomUUID(),
      action: 'access_revocation',
      actorId: actorId as any,
      patientId: patientId as any,
      requestId: requestId as any,
      details: `Access revoked for patient ${patientId} by doctor ${doctorId}`,
      timestamp: new Date(),
      status: 'recorded'
    });
  },

  async recordDocumentAccess({ recordId, hash, actorId, patientId }) {
    return persist({
      txId: crypto.randomUUID(),
      action: 'document_access',
      hash,
      actorId: actorId as any,
      patientId: patientId as any,
      recordId: recordId as any,
      details: 'Medical record access event anchored to ledger',
      timestamp: new Date(),
      status: 'recorded'
    });
  },

  async verifyDocument(recordId) {
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      throw new Error('Document not found');
    }
    if (!record.storedFilename || !record.sha256Hash) {
      return { matches: false, storedHash: '', currentHash: '' };
    }
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'uploads', record.storedFilename);
    let currentHash = '';
    try {
      const data = await fs.readFile(filePath);
      currentHash = crypto.createHash('sha256').update(data).digest('hex');
    } catch {
      currentHash = 'UNAVAILABLE';
    }
    const matches = currentHash === record.sha256Hash;
    const tx = record.blockchainTxId ? await this.getTransaction(record.blockchainTxId) : undefined;
    return { matches, storedHash: record.sha256Hash, currentHash, transaction: tx ?? undefined };
  },

  async getTransaction(txId) {
    const doc = await BlockchainTransaction.findOne({ txId });
    if (!doc) return null;
    return toTx(doc);
  }
};