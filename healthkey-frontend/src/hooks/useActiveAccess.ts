import { useCallback, useEffect, useState } from 'react';
import { accessAPI, getErrorMessage } from '../lib/api';
import { AccessRequest, AccessPermissionKey } from '../types';

export function useActiveAccessPermissions() {
  const [patients, setPatients] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accessAPI.getActive();
      setPatients(res.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasPermission = (permission: AccessPermissionKey, request?: AccessRequest | null): boolean => {
    const target = request || patients[0];
    return Boolean(target?.permissions[permission]);
  };

  return { patients, loading, error, hasPermission, reload: load };
}