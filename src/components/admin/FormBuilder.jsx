/**
 * Form Builder Component
 * Configure contact form fields for service pages
 */

import { useState } from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';

const FormBuilder = ({ initialFields = [], onSave }) => {
  const [fields, setFields] = useState(initialFields);

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      order: fields.length + 1
    };
    setFields([...fields, newField]);
  };

  const updateField = (index, updates) => {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeField = (index) => {
    const field = fields[index];
    if (['name', 'email'].includes(field.name)) {
      return; // Cannot remove mandatory fields
    }
    setFields(fields.filter((_, i) => index !== i));
  };

  const isMandatory = (fieldName) => ['name', 'email'].includes(fieldName);

  const handleSave = () => {
    onSave(fields);
  };

  return (
    <div>
      {/* Mandatory Fields Notice */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4" />
          <span>Name and Email fields are mandatory and cannot be removed</span>
        </div>
      </div>

      {/* Fields List */}
      <div className="space-y-4 mb-6">
        {/* Mandatory Name Field */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <span className="font-medium">Name *</span>
            </div>
            <span className="text-xs text-gray-500">Required</span>
          </div>
        </div>

        {/* Mandatory Email Field */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <span className="font-medium">Email *</span>
            </div>
            <span className="text-xs text-gray-500">Required</span>
          </div>
        </div>

        {/* Additional Fields */}
        {fields.map((field, index) => (
          <div key={field.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value })}
                    disabled={isMandatory(field.name)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Text Area</option>
                    <option value="number">Number</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Required</label>
                  <select
                    value={field.required ? 'true' : 'false'}
                    onChange={(e) => updateField(index, { required: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              {!isMandatory(field.name) && (
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Field Button */}
      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 mb-6"
      >
        <Plus className="h-4 w-4" /> Add Field
      </button>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8]"
        >
          Save Form Configuration
        </button>
      </div>
    </div>
  );
};

export default FormBuilder;