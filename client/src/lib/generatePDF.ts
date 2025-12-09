import { jsPDF } from "jspdf";
import type { EstimateResult } from "../../../shared/roofing";
import { PRICING_TIERS } from "../../../shared/roofing";

interface PDFData {
  estimate: EstimateResult;
  address: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export function generateProposalPDF(data: PDFData): void {
  const { estimate, address, customerName, customerEmail, customerPhone } = data;
  const doc = new jsPDF();
  
  // Colors - Teal theme
  const tealColor: [number, number, number] = [0, 128, 128];
  const blackColor: [number, number, number] = [30, 30, 30];
  const grayColor: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [240, 240, 240];

  let yPos = 20;

  // Header with company branding
  doc.setFillColor(...tealColor);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("NextDoor Exterior Solutions", 20, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Professional Roofing Solutions", 20, 33);

  yPos = 55;

  // Title
  doc.setTextColor(...blackColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Roof Replacement Estimate", 20, yPos);
  yPos += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
  yPos += 15;

  // Customer Info Section
  if (customerName || customerEmail || customerPhone) {
    doc.setFillColor(...lightGray);
    doc.rect(15, yPos - 5, 180, 30, "F");
    
    doc.setTextColor(...blackColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Information", 20, yPos + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let infoY = yPos + 15;
    if (customerName) {
      doc.text(`Name: ${customerName}`, 20, infoY);
      infoY += 6;
    }
    if (customerEmail) {
      doc.text(`Email: ${customerEmail}`, 80, yPos + 15);
    }
    if (customerPhone) {
      doc.text(`Phone: ${customerPhone}`, 140, yPos + 15);
    }
    yPos += 35;
  }

  // Property Address
  doc.setFillColor(...tealColor);
  doc.rect(15, yPos, 180, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Property Address", 20, yPos + 8);
  doc.setFont("helvetica", "normal");
  doc.text(address, 20, yPos + 15);
  yPos += 30;

  // Roof Measurements
  doc.setTextColor(...blackColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Roof Measurements", 20, yPos);
  yPos += 10;

  // Measurements table
  const measurements = [
    ["Total Roof Area", `${estimate.roofData.totalRoofArea.toLocaleString()} sq ft`],
    ["Waste Factor (10%)", `${Math.round(estimate.roofData.totalRoofArea * 0.1).toLocaleString()} sq ft`],
    ["Adjusted Area", `${estimate.adjustedArea.toLocaleString()} sq ft`],
    ["Roof Pitch", `${estimate.roofData.averagePitch}/12`],
    ["Number of Squares", `${Math.round(estimate.adjustedArea / 100)}`],
    ["Eave Length (Est.)", `${estimate.roofData.eaveLength.toLocaleString()} ft`],
    ["Ridge/Valley Length (Est.)", `${estimate.roofData.ridgeValleyLength.toLocaleString()} ft`],
  ];

  doc.setFontSize(10);
  measurements.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...lightGray);
      doc.rect(15, yPos - 4, 180, 8, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text(row[0], 20, yPos);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...blackColor);
    doc.text(row[1], 150, yPos);
    yPos += 8;
  });

  if (estimate.hasPitchSurcharge) {
    yPos += 5;
    doc.setTextColor(200, 100, 0);
    doc.setFontSize(9);
    doc.text("* 10% pitch surcharge applied for steep roof (pitch > 6/12)", 20, yPos);
    yPos += 10;
  } else {
    yPos += 10;
  }

  // Pricing Options
  doc.setTextColor(...blackColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Pricing Options", 20, yPos);
  yPos += 10;

  // Pricing cards
  const cardWidth = 55;
  const cardHeight = 45;
  const startX = 20;

  PRICING_TIERS.forEach((tier, index) => {
    const x = startX + (index * (cardWidth + 10));
    const price = estimate.pricing[tier.name];
    
    // Card background
    if (tier.name === "better") {
      doc.setFillColor(...tealColor);
      doc.setDrawColor(...tealColor);
    } else if (tier.name === "best") {
      doc.setFillColor(218, 165, 32);
      doc.setDrawColor(218, 165, 32);
    } else {
      doc.setFillColor(200, 200, 200);
      doc.setDrawColor(150, 150, 150);
    }
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, "FD");
    
    // Tier label
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(tier.label.toUpperCase(), x + cardWidth / 2, yPos + 10, { align: "center" });
    
    // Description
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(tier.description, x + cardWidth / 2, yPos + 18, { align: "center" });
    
    // Price
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`$${price.toLocaleString()}`, x + cardWidth / 2, yPos + 32, { align: "center" });
    
    // Per square
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`$${tier.pricePerSquare}/sq`, x + cardWidth / 2, yPos + 40, { align: "center" });
  });

  yPos += cardHeight + 15;

  // What's Included
  doc.setTextColor(...blackColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("What's Included:", 20, yPos);
  yPos += 8;

  const inclusions = [
    "Complete tear-off of existing roofing materials",
    "Installation of new underlayment",
    "New drip edge and flashing",
    "Professional installation by licensed contractors",
    "Cleanup and debris removal",
    "Manufacturer warranty on materials",
    "Workmanship warranty",
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  inclusions.forEach((item) => {
    doc.setTextColor(...tealColor);
    doc.text("✓", 20, yPos);
    doc.setTextColor(...blackColor);
    doc.text(item, 28, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Disclaimer
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos - 3, 180, 25, "F");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "italic");
  const disclaimer = "Disclaimer: This estimate is based on satellite imagery and measurements. Final pricing is subject to onsite inspection. Additional costs may apply for tear-off, decking repairs, chimney flashing, skylights, or other complex roof features. Prices valid for 30 days from the date of this estimate.";
  const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
  doc.text(splitDisclaimer, 20, yPos + 3);

  // Footer
  doc.setFillColor(...tealColor);
  doc.rect(0, 280, 210, 17, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("NextDoor Exterior Solutions", 20, 289);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Call us today for your free onsite inspection!", 100, 289);

  // Save the PDF
  const filename = `NextDoor_Exterior_Solutions_Estimate_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
