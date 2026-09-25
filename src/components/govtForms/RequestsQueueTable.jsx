import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getDprWorkflowStatus } from '../../utils/dprWorkflowStatus';

const RequestsQueueTable = ({
  requests,
  loading,
  emptyMessage = 'No submissions found in this queue.',
  hideStaffOwner = false,
  wideTable = false,
  statusMode = 'queue',
  selectable = false,
  selectedRequestIds = [],
  onToggleRequest,
  onToggleAll,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7e22ce]"></div>
      </div>
    );
  }

  const selectedSet = new Set(selectedRequestIds);
  const allSelected =
    selectable && requests.length > 0 && requests.every((request) => selectedSet.has(request._id));
  const colSpan = (hideStaffOwner ? 6 : 7) + (selectable ? 1 : 0);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${wideTable ? 'w-full' : ''}`}>
      <div className="overflow-x-auto">
        <table className={`divide-y divide-gray-200 ${wideTable ? 'w-full min-w-[1100px]' : 'min-w-full'}`}>
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => onToggleAll?.(event.target.checked, requests)}
                    aria-label="Select all visible requests"
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Request</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              {!hideStaffOwner && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Owner</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="text-center py-12 text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                 const data = req.submittedData || {};
                 
                 // Look up dynamic form field definitions to map name/email fallback
                 const fields = req.formId?.fields || [];
                 const nameField = fields.find(f => f.id && (f.id.toLowerCase().includes('name') || f.label?.toLowerCase().includes('name') || f.label?.toLowerCase().includes('applicant')));
                 const dynamicName = nameField ? data[nameField.id] : null;

                 const emailField = fields.find(f => f.type === 'email' || f.id?.toLowerCase().includes('email') || f.label?.toLowerCase().includes('email'));
                 const dynamicEmail = emailField ? data[emailField.id] : null;

                 const applicantName = req.customerId?.name || dynamicName || data.name || data.fullname || data.applicantName || data.govt_builtin_name || 'N/A';
                 const rawEmail = req.customerId?.email || dynamicEmail || data.email || data.applicantEmail || data.govt_builtin_email || '';
                 const applicantEmail = typeof rawEmail === 'string' && rawEmail.endsWith('@phone.customer.finvois') ? '' : rawEmail;
                 const applicantPhone = req.customerId?.phone || data.govt_builtin_phone || data.phone || data.mobile || '';
                 const formName = req.formId?.name || 'Deleted Form';
                 const rawDeptName = req.departmentId?.name || 'Unknown Department';
                 const deptName = rawDeptName === 'AP TEST' ? 'AP MSME' : rawDeptName;

                 const assignee = req.assignedTo?.name || req.claimedBy?.name || '—';
                 const workflow = getDprWorkflowStatus(req, req.reportId);

                return (
                  <tr key={req._id} className="hover:bg-gray-50">
                    {selectable && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(req._id)}
                          onChange={(event) => onToggleRequest?.(req._id, event.target.checked)}
                          aria-label={`Select request ${req._id}`}
                          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{applicantName}</div>
                      {applicantPhone && <div className="text-xs text-gray-500">{applicantPhone}</div>}
                      {applicantEmail && <div className="text-xs text-gray-500">{applicantEmail}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {deptName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {statusMode === 'workflow' ? (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${workflow.badgeClass}`}>
                          {workflow.label}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            req.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : req.status === 'assigned'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'claimed'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {req.status.toUpperCase()}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {req.reportId?.payment?.status === 'completed' ? (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700">Paid</span>
                            ) : req.reportId ? (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-700">Unpaid</span>
                            ) : null}
                            {req.reportId?.validation_status === 'approved' && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-50 text-green-700">CA OK</span>
                            )}
                            {(req.reportId?.validation_status === 'pending_validation' ||
                              req.reportId?.validation_status === 'under_review') && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700">CA</span>
                            )}
                            {req.reportId?.validation_status === 'rejected' && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-50 text-red-700">Queried</span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    {!hideStaffOwner && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignee}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/customer-service/requests/${req._id}`}
                        className="text-[#7e22ce] hover:text-[#6b21a8] inline-flex items-center gap-0.5"
                      >
                        Process Request <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestsQueueTable;
