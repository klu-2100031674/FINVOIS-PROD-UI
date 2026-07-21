import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, CheckCircle2, ChevronRight } from 'lucide-react';

const RequestsQueueTable = ({ requests, loading, emptyMessage = 'No submissions found in this queue.' }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7e22ce]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Request</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12 text-gray-500">
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

                 const applicantName = req.customerId?.name || dynamicName || data.name || data.fullname || data.applicantName || 'N/A';
                 const applicantEmail = req.customerId?.email || dynamicEmail || data.email || data.applicantEmail || '';
                 const formName = req.formId?.name || 'Deleted Form';
                 const deptName = req.departmentId?.name || 'Unknown Department';

                 const assignee = req.assignedTo?.name || req.claimedBy?.name || '—';

                return (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{applicantName}</div>
                      {applicantEmail && <div className="text-xs text-gray-500">{applicantEmail}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {deptName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignee}
                    </td>
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
