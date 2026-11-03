import type { Employee } from '../types.ts';

/**
 * Generates an industrial .csd (CardStudio Document / SMART iDesigner) configuration file.
 * Compatible with Zebra CardStudio v1.x / v2.x and IDP SMART iDesigner.
 */
export function generateCsdContent(employee?: Employee | null): string {
  const nombre = employee?.nombre || 'JUANITO SANTANA';
  const puesto = employee?.puesto || 'SEGURIDAD';
  const empresa = employee?.empresa || 'PROCESADORA DE CERDOS';
  const codigo = employee?.codigo || 'AGF-001';
  const fotoUrl = employee?.fotoUrl || '';

  const qrPayload = `${codigo}|${nombre}|${puesto}|${empresa}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<CardStudioProject version="2.0" engine="IDP-SMART51-CardStudio-Exporter">
  <DocumentSettings>
    <FormatName>CR80 Vertical Standard</FormatName>
    <CardStandard>ISO/IEC 7810 ID-1</CardStandard>
    <Unit>mm</Unit>
    <Width>54.00</Width>
    <Height>85.60</Height>
    <Orientation>Portrait</Orientation>
    <DPI>300</DPI>
    <ColorProfile>Direct-to-Card YMCKO</ColorProfile>
    <TargetPrinter>IDP SMART-51 Card Printer</TargetPrinter>
    <PrintMargins top="0.0" left="0.0" right="0.0" bottom="0.0" edgeToEdge="true" />
  </DocumentSettings>

  <Layout sides="SingleSide">
    <Side name="Front" background="#FFFFFF">
      <!-- 1. Top Agrofem Brand Logo -->
      <Object id="obj_logo" type="Image" locked="true">
        <Bounds x="8.50" y="2.50" width="37.00" height="18.00" unit="mm" />
        <Source type="File">assets/agrofem_logo.png</Source>
        <Description>Agrofem Logo - Mejor carne para un mejor país</Description>
        <KeepAspectRatio>true</KeepAspectRatio>
      </Object>

      <!-- 2. Central Employee Variable Photo (24mm x 29mm framed) -->
      <Object id="obj_photo" type="VariablePhoto">
        <Bounds x="15.00" y="21.50" width="24.00" height="29.00" unit="mm" />
        <DataField name="FOTO_EMPLEADO" />
        <Value>${fotoUrl}</Value>
        <Border width="0.2" color="#D1D5DB" style="Solid" />
        <AspectRatio>FitCenterCrop</AspectRatio>
      </Object>

      <!-- 3. Employee Name (Segoe UI Black / Arial Black 900) -->
      <Object id="obj_nombre" type="Text">
        <Bounds x="2.00" y="52.00" width="50.00" height="5.50" unit="mm" />
        <DataField name="NOMBRE" />
        <Value>${escapeXml(nombre)}</Value>
        <Font name="Segoe UI Black" size="11.5pt" weight="900" style="Bold" />
        <Alignment horizontal="Center" vertical="Middle" />
        <Color>#000000</Color>
        <AutoFitText>true</AutoFitText>
      </Object>

      <!-- 4. Job Title / Puesto -->
      <Object id="obj_puesto" type="Text">
        <Bounds x="2.00" y="58.00" width="50.00" height="4.80" unit="mm" />
        <DataField name="PUESTO" />
        <Value>${escapeXml(puesto)}</Value>
        <Font name="Segoe UI Black" size="10.5pt" weight="900" style="Bold" />
        <Alignment horizontal="Center" vertical="Middle" />
        <Color>#000000</Color>
        <AutoFitText>true</AutoFitText>
      </Object>

      <!-- 5. Division / Empresa -->
      <Object id="obj_empresa" type="Text">
        <Bounds x="2.00" y="63.50" width="50.00" height="4.80" unit="mm" />
        <DataField name="EMPRESA" />
        <Value>${escapeXml(empresa)}</Value>
        <Font name="Segoe UI Black" size="10.5pt" weight="900" style="Bold" />
        <Alignment horizontal="Center" vertical="Middle" />
        <Color>#000000</Color>
        <AutoFitText>true</AutoFitText>
      </Object>

      <!-- 6. Bottom QR Code -->
      <Object id="obj_qrcode" type="Barcode">
        <Bounds x="17.50" y="66.50" width="19.00" height="19.00" unit="mm" />
        <BarcodeType>QRCode</BarcodeType>
        <DataField name="QR_TOKEN" />
        <Value>${escapeXml(qrPayload)}</Value>
        <ErrorCorrectionLevel>M</ErrorCorrectionLevel>
        <ModuleSize>0.4</ModuleSize>
        <Foreground>#000000</Foreground>
        <Background>#FFFFFF</Background>
      </Object>
    </Side>
  </Layout>

  <DataSchema>
    <Field name="CODIGO" type="String" unique="true" sample="${escapeXml(codigo)}" />
    <Field name="NOMBRE" type="String" sample="${escapeXml(nombre)}" />
    <Field name="PUESTO" type="String" sample="${escapeXml(puesto)}" />
    <Field name="EMPRESA" type="String" sample="${escapeXml(empresa)}" />
    <Field name="FOTO_EMPLEADO" type="ImageURL" sample="${escapeXml(fotoUrl)}" />
    <Field name="QR_TOKEN" type="String" sample="${escapeXml(qrPayload)}" />
  </DataSchema>
</CardStudioProject>
`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Triggers a client-side download of the .csd file.
 */
export function downloadCsdFile(employee?: Employee | null, filename?: string): void {
  const content = generateCsdContent(employee);
  const blob = new Blob([content], { type: 'application/x-cardstudio-csd;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const safeName = employee
    ? `Carnet_${employee.nombre.replace(/\s+/g, '_')}_${employee.codigo}`
    : 'Plantilla_Agrofem_SMART51';

  a.href = url;
  a.download = `${filename || safeName}.csd`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
