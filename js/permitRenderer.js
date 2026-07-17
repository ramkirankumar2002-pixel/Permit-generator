// =====================================================
// permitRenderer.js — Renders one permit as HTML
// =====================================================

import { getSignatures } from './signatureManager.js';

/**
 * Build the QR code data string for a permit
 */
function buildQRData(p) {
  return [
    `Serial No: ${p.serialNo}`,
    `Dispatch Slip: ${p.dispatchSlipNo}`,
    `Vehicle No: ${p.vehicleNo}`,
    `Driver License: ${p.driverLicenseNo}`,
    `Driver Phone: ${p.driverPhone}`,
    `Date & Time: ${p.dispatchDateTime}`,
    `Quantity: ${p.quantity} MT`,
    `Mineral: ${p.mineralName}`
  ].join('\n');
}

/**
 * Generate a QR code canvas and return it as a data URL
 */
function generateQRDataURL(text) {
  return new Promise((resolve) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      // eslint-disable-next-line no-undef
      new QRCode(container, {
        text: text,
        width: 90,
        height: 90,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });

      setTimeout(() => {
        const canvas = container.querySelector('canvas');
        const img = container.querySelector('img');
        if (canvas) {
          resolve(canvas.toDataURL('image/png'));
        } else if (img) {
          resolve(img.src);
        } else {
          resolve('');
        }
        document.body.removeChild(container);
      }, 100);
    } catch (e) {
      resolve('');
    }
  });
}

/**
 * Render a single permit HTML element
 * @param {object} p — permit data object
 * @param {string} qrDataUrl — base64 QR image
 * @returns {HTMLElement}
 */
export function renderPermit(p, qrDataUrl) {
  const sigs = getSignatures();

  const doc = document.createElement('div');
  doc.className = 'permit-doc';
  doc.setAttribute('data-permit-id', p.serialNo);

  const adddSig = sigs.addd
    ? `<img src="${sigs.addd}" alt="AD/DD Signature" style="max-height:44px;max-width:120px;object-fit:contain;">`
    : '';

  const authorizedSig = sigs.authorized
    ? `<img src="${sigs.authorized}" alt="Authorized Signature" style="max-height:44px;max-width:120px;object-fit:contain;">`
    : '';

  const sealImg = sigs.seal
    ? `<img src="${sigs.seal}" alt="Company Seal" style="max-height:44px;max-width:80px;object-fit:contain;">`
    : '';

  const qrImg = qrDataUrl
    ? `<img src="${qrDataUrl}" alt="QR Code" style="width:80px;height:80px;">`
    : '';

  doc.innerHTML = `
    <!-- ===== PERMIT HEADER ===== -->
    <div class="permit-header">
      <div style="position:relative;">
        <div style="text-align:center; padding-right:95px;">
          <div class="h1" style="font-size:13pt;font-weight:bold;font-family:Arial,sans-serif;letter-spacing:0.5px;">GOVERNMENT OF TAMIL NADU</div>
          <div class="h2" style="font-size:11pt;font-weight:bold;font-family:Arial,sans-serif;margin-top:2px;">DEPARTMENT OF GEOLOGY AND MINING</div>
          <div class="h3" style="font-size:9.5pt;font-family:Arial,sans-serif;margin-top:2px;">O/o. DEPUTY DIRECTOR / ASSISTANT DIRECTOR</div>
          <div class="h4" style="font-size:10pt;font-weight:bold;font-family:Arial,sans-serif;margin-top:3px;">TRANSPORT PERMIT (Original)</div>
        </div>
        <div style="position:absolute;top:0;right:0;text-align:right;">
          <div style="font-size:10pt;font-weight:bold;margin-bottom:4px;">${p.serialNo}</div>
          ${qrImg ? `<div>${qrImg}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- ===== PERMIT TABLE ===== -->
    <table class="permit-table">
      <!-- HSN + Dispatch Date/Time Row -->
      <tr class="row-dispatch">
        <td colspan="2" class="label">HSN Code: ${p.hsnCode}</td>
        <td colspan="4" style="text-align:right;" class="label">Date &amp; Time of Dispatch : <strong>${p.dispatchDateTime}</strong></td>
      </tr>

      <!-- Lessee ID | Mine Code | Lease Area Details | Serial No -->
      <tr>
        <td class="label" style="width:14%;">Lessee Id</td>
        <td style="width:16%;">${p.lesseeId}</td>
        <td class="label" style="width:12%;">Minecode:</td>
        <td style="width:16%;">${p.mineCode}</td>
        <td class="label" style="width:16%;">Lease Area Details</td>
        <td class="label">Serial No: <span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.serialNo}</span></td>
      </tr>

      <!-- Lessee Name | District -->
      <tr>
        <td class="label">Lessee Name and Address:</td>
        <td colspan="3">${p.lesseeNameAddress}</td>
        <td class="label">District Name:</td>
        <td>${p.districtName}</td>
      </tr>

      <!-- Full Address | Taluk -->
      <tr>
        <td colspan="4" rowspan="3" class="addr-cell" style="vertical-align:top;padding:5px 7px;">${p.lesseeFullAddress}</td>
        <td class="label">Taluk Name:</td>
        <td>${p.talukName}</td>
      </tr>

      <!-- Village -->
      <tr>
        <td class="label">Village:</td>
        <td>${p.village}</td>
      </tr>

      <!-- SF No -->
      <tr>
        <td class="label">SF.No / Extent:</td>
        <td>${p.sfNoExtent}</td>
      </tr>

      <!-- Mineral | Bulk Permit | Classification -->
      <tr>
        <td class="label">Mineral Name: ${p.mineralName}</td>
        <td colspan="3">Bulk Permit No: ${p.bulkPermitNo}</td>
        <td class="label">Classification:</td>
        <td>${p.classification}</td>
      </tr>

      <!-- Order Ref | Lease Period -->
      <tr>
        <td class="label">Order Ref:</td>
        <td colspan="3">${p.orderRef || ''}</td>
        <td class="label">Lease Period:</td>
        <td>${p.leasePeriod}</td>
      </tr>

      <!-- Dispatch Slip No | Within TN -->
      <tr>
        <td class="label">Dispatch Slip No:</td>
        <td colspan="3"><span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.dispatchSlipNo}</span></td>
        <td class="label">Within Tamil Nadu:</td>
        <td>${p.withinTamilNadu}</td>
      </tr>

      <!-- Delivered To -->
      <tr>
        <td class="label">Delivered To:</td>
        <td colspan="5">${p.deliveredTo}</td>
      </tr>

      <!-- Vehicle No | Destination Address -->
      <tr>
        <td class="label">Vehicle No:</td>
        <td colspan="3"><span class="cell-green" style="padding:1px 6px;border-radius:2px;font-weight:bold;">${p.vehicleNo}</span></td>
        <td class="label">Destination Address:</td>
        <td rowspan="2" style="vertical-align:top;">${p.destinationAddress}</td>
      </tr>

      <!-- Vehicle Type -->
      <tr>
        <td class="label">Vehicle Type:</td>
        <td colspan="3">${p.vehicleType}</td>
        <td></td>
      </tr>

      <!-- Total Distance -->
      <tr>
        <td class="label">Total Distance In (Kms):</td>
        <td colspan="5">${p.totalDistance}</td>
      </tr>

      <!-- Travelling Date -->
      <tr>
        <td class="label">Travelling Date:</td>
        <td colspan="5"><span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.travellingDate}</span></td>
      </tr>

      <!-- Required Time -->
      <tr>
        <td class="label">Required Time:</td>
        <td colspan="5"><span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.requiredTime}</span></td>
      </tr>

      <!-- Quantity | Driver Name -->
      <tr>
        <td class="label">Quantity(In MT):</td>
        <td><span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.quantity}</span></td>
        <td class="label" style="width:100px;">Driver Name:</td>
        <td><span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.driverName}</span></td>
        <td colspan="2"></td>
      </tr>

      <!-- Driver License | Via -->
      <tr>
        <td class="label">Driver License No:</td>
        <td><span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.driverLicenseNo}</span></td>
        <td class="label">Via:</td>
        <td>${p.via}</td>
        <td colspan="2"></td>
      </tr>

      <!-- Driver Phone | Authorized Person -->
      <tr>
        <td class="label">Driver Phone No:</td>
        <td><span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.driverPhone}</span></td>
        <td class="label">Lessee / Authorized Person Name:</td>
        <td colspan="3"><span class="cell-green" style="padding:1px 6px;border-radius:2px;">${p.authorizedPersonName}</span></td>
      </tr>

      <!-- Signatures -->
      <tr>
        <td class="sig-cell label" style="height:55px;vertical-align:bottom;">
          Driver Signature:
        </td>
        <td class="sig-cell" style="height:55px;vertical-align:bottom;"></td>
        <td colspan="2" class="sig-cell label" style="height:55px;vertical-align:bottom;">
          Signature of AD / DD:<br>${adddSig}
        </td>
        <td colspan="2" class="sig-cell" style="height:55px;vertical-align:bottom;">
          Lessee / Authorized Person Name:<br>${authorizedSig || p.authorizedPersonName}
        </td>
      </tr>
    </table>
  `;

  return doc;
}

/**
 * Render all permits and attach QR codes
 * @param {Array} permits — array of permit data objects
 * @param {HTMLElement} container — DOM element to append into
 */
export async function renderAllPermits(permits, container) {
  container.innerHTML = '';

  for (let i = 0; i < permits.length; i++) {
    const p = permits[i];
    const qrText = buildQRData(p);
    const qrUrl = await generateQRDataURL(qrText);

    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '32px';

    // Permit number badge
    const badge = document.createElement('div');
    badge.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;';
    badge.innerHTML = `
      <span style="background:#1a237e;color:white;padding:4px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;">
        Permit #${i + 1} of ${permits.length}
      </span>
      <span style="font-size:0.78rem;color:#666;">Serial: ${p.serialNo} | Vehicle: ${p.vehicleNo} | ${p.dispatchDateTime}</span>
    `;

    wrapper.appendChild(badge);
    wrapper.appendChild(renderPermit(p, qrUrl));
    container.appendChild(wrapper);
  }
}
