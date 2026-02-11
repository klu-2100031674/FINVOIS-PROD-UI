/**
 * Stage 1 Page
 * PDF viewer - Shows final calculated results from generated PDF file
 */

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../hooks";
import { Button, Loading, PaymentModal, AnalysisSheetsModal, ReportGenerationModal } from "../components/common";
import { reportAPI } from "../api/endpoints";
import { deductAICredits } from "../store/slices/walletSlice";
import { applyFinalEdits } from "../store/slices/reportSlice";
import { selectRelatedDocuments, clearRelatedDocuments } from '../store/slices/reportSlice';
import toast from "react-hot-toast";

const Stage1Page = () => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);  const [reportTitle, setReportTitle] = useState('');
  const [initialSheetSelections, setInitialSheetSelections] = useState(null);
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const reportId = searchParams.get("reportId");
  const templateId = searchParams.get("templateId");
  const isAdminMode = searchParams.get("admin") === "true";
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingFullReport, setIsGeneratingFullReport] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [editedValue, setEditedValue] = useState("");
  const [pendingEdits, setPendingEdits] = useState({});
  const [iframeRenderVersion, setIframeRenderVersion] = useState(0);
  const iframeRef = useRef(null);
  const cellListenersRef = useRef([]);
  const lockedCellWarningRef = useRef(0);
  const highlightedCellRef = useRef(null);
  const selectedCellElementRef = useRef(null);
  const lastRenderedHtmlRef = useRef(null);
  
  // Dynamic sheet name based on template - CC templates have different naming conventions
  const FINAL_SHEET_NAME = useMemo(() => {
    const upperTemplateId = (templateId || "").toUpperCase();
    // CC1, CC2, CC5 use "FinalWorkings"
    if (/^(FRCC[125]|FORMAT\s*CC[125]|CC[125])$/i.test(templateId || "")) {
      return "FinalWorkings";
    }
    // CC3, CC4 use "Finalworkings" (lowercase 'w')
    if (/^(FRCC[34]|FORMAT\s*CC[34]|CC[34])$/i.test(templateId || "")) {
      return "Finalworkings";
    }
    // CC6 and Term Loan templates use "Final workings" (with space)
    return "Final workings";
  }, [templateId]);
  
  const isTermLoanTemplate = useMemo(
    () => (templateId || "").toUpperCase().includes("TERM_LOAN"),
    [templateId]
  );
  // Enable final workings editing for CC templates (CC1-CC6) as well as Term Loan templates
  const isEditableTemplate = useMemo(() => {
    const upperTemplateId = (templateId || "").toUpperCase();
    return (
      upperTemplateId.includes("TERM_LOAN") ||
      /^(FRCC[1-6]|FORMAT\s*CC[1-6]|CC[1-6])$/i.test(templateId || "")
    );
  }, [templateId]);

  // Get PDF data from Redux
  const generatedExcel = useSelector((state) => state.report.generatedExcel);
  const formData = useSelector((state) => state.report.formData); // Get saved form data
  const pdfBase64 = generatedExcel?.data?.pdfBase64;
  const pdfFileName = generatedExcel?.data?.pdfFileName;
  const htmlContent = generatedExcel?.data?.htmlContent;
  const htmlJsonData = generatedExcel?.data?.htmlJsonData; // JSON data extracted from HTML
  const generatedFileName = generatedExcel?.data?.fileName;
  const relatedDocuments = useSelector(selectRelatedDocuments);

  const parseNumericValue = useCallback((rawValue) => {
    if (rawValue === null || rawValue === undefined) {
      return "";
    }
    if (typeof rawValue === "number") {
      return Number.isFinite(rawValue) ? rawValue : "";
    }
    if (typeof rawValue === "string") {
      const sanitized = rawValue.replace(/[^0-9.\-]/g, "");
      if (!sanitized) {
        return "";
      }
      const parsed = Number(sanitized);
      return Number.isNaN(parsed) ? "" : parsed;
    }
    return "";
  }, []);

  const formatNumericDisplay = useCallback((value) => {
    if (value === "" || value === null || value === undefined) {
      return "";
    }
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return "";
    }
    return numericValue.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }, []);

  const cleanupEditableCells = useCallback(() => {
    cellListenersRef.current.forEach(({ cell, handler }) => {
      try {
        cell.removeEventListener("click", handler);
        cell.style.cursor = "";
      } catch (_) {
        /* no-op */
      }
    });
    cellListenersRef.current = [];

    if (highlightedCellRef.current) {
      highlightedCellRef.current.style.outline = "";
      highlightedCellRef.current.style.outlineOffset = "";
    }
    highlightedCellRef.current = null;
    selectedCellElementRef.current = null;
  }, []);

  useEffect(() => {
    return () => cleanupEditableCells();
  }, [cleanupEditableCells]);

  const handleCellSelection = useCallback(
    (cellElement) => {
      if (!cellElement) return;
      const cellId = cellElement.getAttribute("data-cell");
      if (!cellId) return;

      const labelCell = cellElement.parentElement?.querySelector("td");
      const label = labelCell ? labelCell.textContent?.trim() : cellId;
      const sourceValue =
        htmlJsonData?.data?.[cellId] ?? cellElement.textContent;
      const numericValue = parseNumericValue(sourceValue);

      if (
        highlightedCellRef.current &&
        highlightedCellRef.current !== cellElement
      ) {
        highlightedCellRef.current.style.outline = "";
        highlightedCellRef.current.style.outlineOffset = "";
      }
      highlightedCellRef.current = cellElement;
      cellElement.style.outline = "2px solid #10b981";
      cellElement.style.outlineOffset = "-2px";

      selectedCellElementRef.current = cellElement;
      setSelectedCell({
        cellId,
        label,
        sheetName: FINAL_SHEET_NAME,
      });
      setEditedValue(numericValue === "" ? "" : numericValue.toString());
    },
    [FINAL_SHEET_NAME, htmlJsonData, parseNumericValue]
  );

  const setupEditableCells = useCallback(() => {
    if (!isEditableTemplate || !isEditMode) {
      return;
    }
    const iframeNode = iframeRef.current;
    const iframeDocument =
      iframeNode?.contentDocument || iframeNode?.contentWindow?.document;
    if (!iframeDocument) {
      return;
    }

    cleanupEditableCells();

    const allCells = Array.from(
      iframeDocument.querySelectorAll("td[data-cell]")
    );
    allCells.forEach((cell) => {
      const isEditable = cell.getAttribute("data-editable") === "true";

      if (isEditable) {
        const handler = () => handleCellSelection(cell);
        cell.style.cursor = "pointer";
        cell.addEventListener("click", handler);
        cellListenersRef.current.push({ cell, handler });
        return;
      }

      const lockedTooltip =
        "Locked cell: update the Excel template to edit this value.";
      if (!cell.getAttribute("title")) {
        cell.setAttribute("title", lockedTooltip);
      }

      const lockedHandler = (event) => {
        event.stopPropagation();
        const now = Date.now();
        if (now - lockedCellWarningRef.current < 1500) {
          return;
        }
        lockedCellWarningRef.current = now;
        toast.error(
          "This cell is locked in the template and cannot be edited here."
        );
      };

      cell.style.cursor = "not-allowed";
      cell.addEventListener("click", lockedHandler);
      cellListenersRef.current.push({ cell, handler: lockedHandler });
    });
  }, [
    cleanupEditableCells,
    handleCellSelection,
    isEditMode,
    isEditableTemplate,
  ]);

  useEffect(() => {
    if (!isEditableTemplate || !isEditMode) {
      cleanupEditableCells();
      return;
    }
    setupEditableCells();
    return () => cleanupEditableCells();
  }, [
    cleanupEditableCells,
    htmlContent,
    iframeRenderVersion,
    isEditMode,
    isEditableTemplate,
    setupEditableCells,
  ]);

  useEffect(() => {
    if (!isEditMode) {
      setSelectedCell(null);
      setEditedValue("");
    }
  }, [isEditMode]);

  const displayHTMLContent = useCallback((htmlString) => {
    try {
      console.log("🌐 [displayHTMLContent] Starting HTML display");
      console.log(
        "🌐 [displayHTMLContent] HTML content length:",
        htmlString?.length
      );

      if (!htmlString) {
        console.error("❌ [displayHTMLContent] No HTML content provided");
        return;
      }

      const viewerContainer = document.getElementById("pdf-viewer");
      if (!viewerContainer) {
        console.error("❌ [displayHTMLContent] Viewer container not found");
        setIsLoading(false);
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.display = "block";
      iframe.title = "Report Viewer";

      viewerContainer.innerHTML = "";
      viewerContainer.appendChild(iframe);
      iframeRef.current = iframe;

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlString);
      iframeDoc.close();

      console.log(
        "✅ [displayHTMLContent] HTML content displayed successfully"
      );
      setIsLoading(false);
      setIframeRenderVersion((prev) => prev + 1);
    } catch (error) {
      console.error("❌ [displayHTMLContent] Error displaying HTML:", error);
      toast.error("Failed to display report");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("🚀 [Stage1Page.useEffect] Effect triggered");
    console.log("📋 [Stage1Page.useEffect] reportId:", reportId);
    console.log("📋 [Stage1Page.useEffect] templateId:", templateId);
    console.log(
      "📋 [Stage1Page.useEffect] htmlContent available:",
      !!htmlContent
    );
    console.log(
      "📋 [Stage1Page.useEffect] htmlJsonData available:",
      !!htmlJsonData
    );
    console.log("📋 [Stage1Page.useEffect] pdfBase64 available:", !!pdfBase64);

    if (htmlJsonData) {
      console.log("📊 [Stage1Page] HTML JSON Data:", htmlJsonData);
      console.log(
        "📊 [Stage1Page] Number of cells:",
        Object.keys(htmlJsonData.data || {}).length
      );
      console.log("📊 [Stage1Page] Sample data:", {
        sheetName: htmlJsonData.sheetName,
        timestamp: htmlJsonData.timestamp,
        firstFewCells: Object.entries(htmlJsonData.data || {}).slice(0, 5),
      });
      window.reportJsonData = htmlJsonData;
      console.log(
        "💡 [Stage1Page] JSON data available as window.reportJsonData"
      );
      console.log(
        '💡 [Stage1Page] Example: window.reportJsonData.data["R1C1"]'
      );
    }

    if (!htmlContent) {
      console.log("❌ [Stage1Page.useEffect] No HTML content available");
      setIsLoading(false);
      setTimeout(() => {
        if (!htmlContent) {
          toast.error("No HTML report data available");
        }
      }, 1000);
      return;
    }

    if (lastRenderedHtmlRef.current === htmlContent) {
      console.log(
        "🔒 [Stage1Page.useEffect] Content already displayed, skipping..."
      );
      return;
    }

    console.log("✅ [Stage1Page.useEffect] HTML content available - rendering");
    setFileName(pdfFileName || "FinalWorkings");
    lastRenderedHtmlRef.current = htmlContent;
    displayHTMLContent(htmlContent);
  }, [
    displayHTMLContent,
    htmlContent,
    htmlJsonData,
    pdfBase64,
    pdfFileName,
    reportId,
    templateId,
  ]);

  const displayPDFFromBase64 = (base64Data, fileName) => {
    try {
      console.log("📄 [displayPDFFromBase64] Starting PDF display");
      console.log(
        "📄 [displayPDFFromBase64] Base64 data length:",
        base64Data?.length
      );
      console.log("📄 [displayPDFFromBase64] File name:", fileName);

      if (!base64Data) {
        console.error("❌ [displayPDFFromBase64] No base64 data provided");
        return;
      }

      // Convert base64 to blob
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      console.log("📎 [displayPDFFromBase64] PDF blob URL created:", blobUrl);

      // Create seamless PDF viewer (no controls, looks like normal page)
      const pdfContainer = document.getElementById("pdf-viewer");
      if (pdfContainer) {
        pdfContainer.innerHTML = `
          <div style="width: 100%; height: 100%; position: relative; background: white;">
            <iframe
              src="${blobUrl}"
              style="width: 100%; height: 100%; border: none; display: block;"
              title="Report Viewer"
            ></iframe>
          </div>
        `;

        // Make download function available (for Edit Report button if needed)
        window.downloadPDFFile = () => {
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName || "FinalWorkings.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        console.log(
          "✅ [displayPDFFromBase64] PDF viewer created successfully"
        );
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    } catch (error) {
      console.error("❌ [displayPDFFromBase64] Error:", error);
      toast.error("Failed to display report: " + error.message);
      setIsLoading(false);
    }
  };

  const handleApplyEdit = () => {
    if (!isEditableTemplate) {
      toast.error("Editing is not available for this template type");
      return;
    }
    if (!selectedCell || !selectedCellElementRef.current) {
      toast.error("Select an editable cell from the report");
      return;
    }
    if (editedValue === "" || editedValue === null) {
      toast.error("Enter a valid value for the selected cell");
      return;
    }
    const numericValue = Number(editedValue);
    if (Number.isNaN(numericValue)) {
      toast.error("Only numeric values are supported");
      return;
    }

    const formatted =
      formatNumericDisplay(numericValue) || numericValue.toString();
    selectedCellElementRef.current.textContent = formatted;

    setPendingEdits((prev) => ({
      ...prev,
      [selectedCell.cellId]: {
        sheet: FINAL_SHEET_NAME,
        cell: selectedCell.cellId,
        value: numericValue,
      },
    }));
    toast.success("Cell value staged for update");
  };

  const handleRemovePendingEdit = (cellId) => {
    setPendingEdits((prev) => {
      const next = { ...prev };
      delete next[cellId];
      return next;
    });
  };

  const handleResetPendingEdits = () => {
    setPendingEdits({});
    toast.success("Cleared staged edits");
  };

  const handleSaveEdits = async () => {
    if (!isEditableTemplate) {
      toast.error("Final sheet editing is not available for this template type");
      return;
    }
    const updates = Object.values(pendingEdits);
    if (!updates.length) {
      toast.error("No pending edits to save");
      return;
    }
    if (!templateId) {
      toast.error("Template ID missing; cannot save edits");
      return;
    }
    try {
      setIsSavingEdits(true);
      await dispatch(
        applyFinalEdits({
          templateId,
          updates,
          recalculate: true,
        })
      ).unwrap();
      toast.success("Final workings recalculated successfully");
      setPendingEdits({});
      setSelectedCell(null);
      setEditedValue("");
      selectedCellElementRef.current = null;
      lastRenderedHtmlRef.current = null;
    } catch (error) {
      console.error("❌ Error applying final edits:", error);
      toast.error(error?.message || "Failed to apply final edits");
    } finally {
      setIsSavingEdits(false);
    }
  };

  const pendingEditsList = Object.values(pendingEdits);
  const pendingCount = pendingEditsList.length;

  const handleProceed = () => {
    // Navigate to form page for editing
    navigate(`/form/${templateId}?mode=edit&reportId=${reportId}`);
  };

  const handleDownloadExcel = () => {
    try {
      // Get Excel base64 data from the generated Excel data
      console.log(
        "⬇️ [handleDownloadExcel] Initiating Excel download",
        generatedExcel
      );
      const excelBase64 = generatedExcel?.data?.excelBase64;
      const excelFileName = generatedExcel?.data?.fileName || "report.xlsx";

      console.log(
        "⬇️ [handleDownloadExcel] Excel base64 length:",
        excelBase64?.length
      );

      if (!excelBase64) {
        toast.error("Excel data not available for download");
        return;
      }

      // Convert base64 to blob
      const binary = atob(excelBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = excelFileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);

      toast.success("Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel file");
    }
  };

  const handleGenerateFullReport = async () => {
    // Admin mode: skip payment
    if (isAdminMode) {
      await generateReport();
      return;
    }

    const isTermLoan = (templateId || "").toUpperCase().includes("TERM_LOAN");

    if (isTermLoan) {
      setShowAnalysisModal(true);
    } else {
      // Show payment modal for regular users
      const title = `${templateId} Report - ${new Date().toLocaleDateString()}`;
      setReportTitle(title);
      setShowPaymentModal(true);
    }
  };

  const handleAnalysisConfirm = (data) => {
    setAnalysisData(data);
    setShowAnalysisModal(false);
    
    const title = `${templateId} Report - ${new Date().toLocaleDateString()}`;
    setReportTitle(title);
    
    // Pass analysis selections to payment modal
    setInitialSheetSelections(data.allSelections || {});
    
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    console.log('✅ Payment successful:', paymentData);
    if (relatedDocuments && relatedDocuments.length > 0) {
      try {
        const uploadFormData = new FormData();
        relatedDocuments.forEach((doc) => {
          if (doc.file) {
            uploadFormData.append('files', doc.file);
            uploadFormData.append('titles', doc.title || doc.file.name);
          }
        });

        await reportAPI.uploadRelatedDocuments(paymentData.report_id, uploadFormData);
        dispatch(clearRelatedDocuments());
      } catch (error) {
        console.error('Error uploading related documents:', error);
        toast.error('Failed to upload related documents');
        return;
      }
    }

    // Store the paid report_id to link the generation
    await generateReport(paymentData.report_id, analysisData);
  };

  const generateReport = async (paidReportId = null, analysisOptions = null) => {
    try {
      setIsGeneratingFullReport(true);

      console.log("🚀 Generating full AI report with form data:", formData);
      console.log("🔑 Admin mode:", isAdminMode);

      // Call the full report generation API
      const result = await reportAPI.generateFullReport(templateId, formData, {
        isAdmin: isAdminMode,
        paidReportId: paidReportId, // Link to the paid report
        analysisOptions: analysisOptions // Pass analysis options to backend
      });

      if (result.success) {
        toast.success("Report generated successfully!");

        // Redirect to report ready page (validation message)
        navigate("/report-ready", {
          state: {
            report_id: result.data.report_id,
            validation_status: result.data.validation_status,
            message: result.data.message,
          },
        });

        console.log(
          "✅ Redirected to report ready page - validation pending"
        );

        // Deduct 100 credits from wallet only if not admin mode
        if (!isAdminMode) {
          dispatch(deductAICredits());
        }
      } else {
        throw new Error("Full report generation failed");
      }
    } catch (error) {
      console.error("❌ Error generating full report:", error);
      toast.error(error.message || "Failed to generate full AI report");
    } finally {
      setIsGeneratingFullReport(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <Button
          onClick={() => {
            if (isAdminMode) {
              navigate("/admin/generate");
            } else if (user?.role === 'agent') {
              navigate("/agent/dashboard");
            } else {
              navigate("/dashboard");
            }
          }}
          variant="secondary"
          size="sm"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          {isAdminMode ? "Back to Templates" : "Back to Dashboard"}
        </Button>
        {/* <Button onClick={handleProceed} variant="primary" size="md">
          Edit Report
        </Button> */}
        {/* <Button onClick={handleDownloadExcel} variant="outline" size="md">
          <i className="fas fa-download mr-2"></i>
          Download Excel
        </Button> */}
        {isEditableTemplate && (
          <Button
            onClick={() => setIsEditMode((prev) => !prev)}
            variant={isEditMode ? "outline" : "primary"}
            size="md"
          >
            {isEditMode ? "Exit Edit Mode" : "Edit Final Sheet"}
          </Button>
        )}
        <Button
          onClick={handleGenerateFullReport}
          variant="success"
          size="md"
          loading={isGeneratingFullReport}
        >
          <i className="fas fa-magic mr-2"></i>
          Generate DPR Report
        </Button>
        {isAdminMode && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Admin Mode
          </span>
        )}
        <div className="flex-1"></div>
        <small className="text-gray-600 ml-4">Final Report</small>
      </header>

      {/* Content Area - Clean display without PDF indicators */}
      <div className="flex-1 relative flex">
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
              <Loading text="Loading Report" />
            </div>
          )}

          {isSavingEdits && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40">
              <Loading text="Applying Final Sheet Edits" />
            </div>
          )}

          {!isLoading && !htmlContent && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
              <div className="text-center max-w-md">
                <i className="fas fa-file-alt text-6xl text-gray-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Report Not Available
                </h3>
                <p className="text-gray-600 mb-4">
                  Your HTML report is not available. Please try generating the
                  report again.
                </p>
                <Button
                  onClick={() => user?.role === 'agent' ? navigate("/agent/dashboard") : navigate("/dashboard")}
                  variant="primary"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

          {htmlContent && (
            <div
              id="pdf-viewer"
              className="w-full h-full"
              style={{ minHeight: "500px", overflow: "hidden" }}
            ></div>
          )}
        </div>

        {isEditableTemplate && isEditMode && (
          <aside className="w-full max-w-sm border-l border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">
                Final Workings Adjustments
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Click any value marked as editable inside the preview to stage a
                new number for Final Workings.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Selected Cell
                </p>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 min-h-[64px]">
                  {selectedCell ? (
                    <div>
                      <p className="font-semibold text-gray-800">
                        {selectedCell.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedCell.cellId}
                      </p>
                    </div>
                  ) : (
                    <p>No editable cell selected yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-xs font-semibold text-gray-600"
                  htmlFor="edit-value-input"
                >
                  New Value
                </label>
                <input
                  id="edit-value-input"
                  type="text"
                  value={editedValue}
                  onChange={(event) => setEditedValue(event.target.value)}
                  disabled={!isEditMode || !selectedCell}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200 disabled:bg-gray-100"
                  placeholder="Enter numeric value"
                />
                <Button
                  onClick={handleApplyEdit}
                  size="sm"
                  variant="primary"
                  disabled={!isEditMode || !selectedCell}
                >
                  Stage Value
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Pending Edits ({pendingCount})
                  </h4>
                  {pendingCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetPendingEdits}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {pendingCount === 0 ? (
                  <p className="text-xs text-gray-500">
                    Stage values to update Final Workings.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pendingEditsList.map((item) => (
                      <li
                        key={item.cell}
                        className="flex items-center justify-between rounded-md border border-gray-200 px-2 py-1 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item.cell}
                          </p>
                          <p className="text-gray-500">
                            ₹ {formatNumericDisplay(item.value)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-red-500 hover:underline"
                          onClick={() => handleRemovePendingEdit(item.cell)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={handleSaveEdits}
                variant="success"
                size="md"
                disabled={!pendingCount || isSavingEdits}
                loading={isSavingEdits}
                className="w-full"
              >
                Apply Changes to Final Sheet
              </Button>
            </div>
          </aside>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        templateId={templateId}
        reportTitle={reportTitle}
        initialSelections={initialSheetSelections}
        onPaymentSuccess={handlePaymentSuccess}
        analysisOptions={analysisData}
      />

      <AnalysisSheetsModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        templateId={templateId}
        onConfirm={handleAnalysisConfirm}
      />

      {/* Report Generation Progress Modal */}
      <ReportGenerationModal isOpen={isGeneratingFullReport} />
    </div>
  );
};

export default Stage1Page;
