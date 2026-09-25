import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../../api/apiClient';
import {
  canAdminAssignRequest,
  canAdminUnassignRequest,
  isAdminUnassignLocked,
  staffHandlerName,
  workflowFromLead,
  WORKFLOW_KEYS,
} from '../../utils/dprWorkflowStatus';

function resolveRequest(requestLike) {
  if (!requestLike) return { requestId: null, request: null, report: null };
  if (requestLike.departmentRequest || requestLike.departmentRequestId) {
    const nested = requestLike.departmentRequest;
    const requestId = requestLike.departmentRequestId || nested?._id || null;
    // Prefer the nested DepartmentRequest document — never treat the MSME lead as the request.
    return {
      requestId,
      request: nested || null,
      report: requestLike.report || nested?.reportId || null,
    };
  }
  const looksLikeDeptRequest = Boolean(
    requestLike.formId ||
    requestLike.submittedData ||
    ['open', 'assigned', 'claimed', 'completed'].includes(requestLike.status)
  );
  if (!looksLikeDeptRequest) {
    return { requestId: null, request: null, report: requestLike.report || null };
  }
  return {
    requestId: requestLike._id || null,
    request: requestLike,
    report: requestLike.report || requestLike.reportId || null,
  };
}

const AdminDprStaffActions = ({ requestLike, csAgents = [], onChanged, adminActions = true }) => {
  const [csUserId, setCsUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const { requestId, request, report } = resolveRequest(requestLike);
  const handlerName = staffHandlerName(requestLike) || staffHandlerName(request);

  if (!requestId || !request) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const handleAssign = async (event) => {
    event?.stopPropagation?.();
    if (!csUserId) {
      toast.error('Select a Customer Service agent first');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/govt-forms/requests/${requestId}/assign`, { csUserId });
      toast.success('Request assigned');
      setCsUserId('');
      onChanged?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to assign request'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async (event) => {
    event?.stopPropagation?.();
    setBusy(true);
    try {
      await api.post(`/govt-forms/requests/${requestId}/admin-release`);
      toast.success('Request returned to Pending');
      onChanged?.();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to unassign request'));
    } finally {
      setBusy(false);
    }
  };

  const leadWf = workflowFromLead(requestLike);
  const lockedByLead =
    leadWf.key === WORKFLOW_KEYS.ca_validation || leadWf.key === WORKFLOW_KEYS.generated;
  const locked = lockedByLead || isAdminUnassignLocked(request, report);
  const showAssign = adminActions && !locked && canAdminAssignRequest(request, report);
  const showUnassign = adminActions && !locked && canAdminUnassignRequest(request, report);

  return (
    <div className="flex flex-col gap-1 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
      {handlerName ? (
        <p className="text-xs font-medium text-gray-800 truncate" title={handlerName}>
          {handlerName}
        </p>
      ) : !showAssign ? (
        <span className="text-xs text-gray-400">—</span>
      ) : null}

      {showAssign && (
        <div className="flex items-center gap-1">
          <select
            value={csUserId}
            onChange={(e) => setCsUserId(e.target.value)}
            disabled={busy}
            className="text-xs border border-gray-300 rounded-lg px-1.5 py-1 bg-white max-w-[120px]"
          >
            <option value="">Assign CS</option>
            {csAgents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !csUserId}
            onClick={handleAssign}
            className="text-xs px-2 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      )}

      {showUnassign && (
        <button
          type="button"
          disabled={busy}
          onClick={handleUnassign}
          className="text-xs px-2.5 py-1.5 border border-red-200 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 font-semibold disabled:opacity-50 self-start"
        >
          Unassign
        </button>
      )}
    </div>
  );
};

export default AdminDprStaffActions;
