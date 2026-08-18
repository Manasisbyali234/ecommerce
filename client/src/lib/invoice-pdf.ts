import { jsPDF } from "jspdf";
import type { Order, Invoice } from "./mock-data";
import { store } from "./store";

export function buildInvoicePdf(
  invoice: Invoice,
  order?: Order,
  email?: string,
): jsPDF {
  const settings = store.getCompanyInvoiceSettings();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(settings.companyName || "Metromindz E-Commerce Pvt Ltd", 48, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${settings.address} · ${settings.cityStatePincode}`, 48, y + 16);
  doc.text(`GSTIN: ${settings.gstin} · CIN: ${settings.cin} · ${settings.supportEmail}`, 48, y + 28);

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("TAX INVOICE", w - 48, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(invoice.id, w - 48, y + 20, { align: "right" });

  y += 76;
  doc.setDrawColor(220);
  doc.line(48, y, w - 48, y);
  y += 24;

  // Bill to + meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billed To", 48, y);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customer, 48, y + 16);
  if (email) doc.text(email, 48, y + 30);

  doc.setFont("helvetica", "bold");
  doc.text("Order ID", w - 240, y);
  doc.text("Issued", w - 160, y);
  doc.text("Due", w - 80, y);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.orderId, w - 240, y + 16);
  doc.text(invoice.issued, w - 160, y + 16);
  doc.text(invoice.due, w - 80, y + 16);

  y += 60;

  // Line items header
  doc.setFillColor(245, 246, 250);
  doc.rect(48, y - 14, w - 96, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DESCRIPTION", 56, y);
  doc.text("QTY", w - 220, y, { align: "right" });
  doc.text("UNIT PRICE", w - 140, y, { align: "right" });
  doc.text("AMOUNT", w - 56, y, { align: "right" });

  y += 26;
  doc.setFont("helvetica", "normal");

  const itemCount = typeof order?.items === "number" ? order.items : Array.isArray(order?.items) ? order.items.length : 1;
  const unit = invoice.amount / Math.max(1, itemCount);
  for (let i = 0; i < itemCount; i++) {
    const itemTitle = Array.isArray(order?.items) && order.items[i]?.title ? order.items[i].title : `Order ${invoice.orderId} — Item ${i + 1}`;
    doc.text(itemTitle, 56, y);
    doc.text(String(1), w - 220, y, { align: "right" });
    doc.text(`Rs. ${unit.toFixed(2)}`, w - 140, y, { align: "right" });
    doc.text(`Rs. ${unit.toFixed(2)}`, w - 56, y, { align: "right" });
    y += 20;
  }

  y += 12;
  doc.setDrawColor(220);
  doc.line(w - 260, y, w - 48, y);
  y += 20;

  const taxRate = (settings.gstTaxRatePercent || 18) / 100;
  const subtotal = invoice.amount / (1 + taxRate);
  const totalTax = invoice.amount - subtotal;

  doc.setFont("helvetica", "normal");
  doc.text("Taxable Value", w - 200, y);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, w - 56, y, { align: "right" });
  y += 18;
  doc.text(`GST (${settings.gstTaxRatePercent}%)`, w - 200, y);
  doc.text(`Rs. ${totalTax.toFixed(2)}`, w - 56, y, { align: "right" });
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Grand Total", w - 200, y);
  doc.text(`Rs. ${invoice.amount.toFixed(2)}`, w - 56, y, { align: "right" });

  y += 50;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Status: ${invoice.status.toUpperCase()} · ${settings.legalTerms}`,
    48,
    y,
  );

  return doc;
}

export function downloadInvoicePdf(invoice: Invoice, order?: Order, email?: string) {
  const doc = buildInvoicePdf(invoice, order, email);
  doc.save(`${invoice.id}.pdf`);
}
