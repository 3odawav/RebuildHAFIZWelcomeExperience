; ============================================================================
; HAFIZ In Slang — Official Native Windows 11 Installer (Inno Setup 6)
; Bilingual Arabic (RTL) & English (LTR) Setup Wizard
; Default Program Path: D:\HAFIZ_In_Slang when D: exists; safe fallback otherwise
; Default Model Storage Path: E:\HAFIZ_Models when E: exists; safe fallback otherwise
; Supports 3-Way Model Setup Strategy:
;   (A) Download verified components
;   (B) Scan existing local partitions (D:\AI\LMStudio-Models\local, E:\, D:\) in-place
;   (C) Custom hybrid per-capability paths
; Preserves user data, model files, and settings across upgrade, repair, and uninstall.
; ============================================================================

#define MyAppName "HAFIZ In Slang"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "HAFIZ Studio"
#define MyAppExeName "HAFIZ.exe"
#define SourcePublishDir "..\artifacts\win-x64\publish"

[Setup]
AppId={{6F3A9D54-9A14-4C8F-B1E9-3E7A2A1B8E42}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={code:GetDefaultInstallDir}
DisableDirPage=no
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\artifacts\installer
OutputBaseFilename=HAFIZ_Setup
Compression=lzma2/ultra64
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
WizardStyle=modern
UninstallDisplayIcon={app}\{#MyAppExeName}
ShowLanguageDialog=yes

[Languages]
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
english.ModelPathTitle=Model Storage Location
english.ModelPathSub=Choose where downloaded AI models will be stored (existing models are never moved).
english.StrategyTitle=AI Model & Runtime Strategy
english.StrategySub=Choose how HAFIZ should configure local AI models during first launch.
english.StrategyDownload=Option A: Download all required compatible AI components (resumable + SHA-256 verified)
english.StrategyScan=Option B: Scan existing local partitions (D:\AI\LMStudio-Models\local, E:\, D:\) in-place without moving files
english.StrategyHybrid=Option C: Hybrid — link existing local models and download only missing components

arabic.ModelPathTitle=مسار تخزين الموديلات
arabic.ModelPathSub=اختر مجلد حفظ الموديلات الجديدة (الموديلات الموجودة على جهازك لن يتم نقلها أبداً).
arabic.StrategyTitle=إعداد نماذج الذكاء الاصطناعي
arabic.StrategySub=اختر كيف يجهّز حافظ الموديلات عند أول تشغيل.
arabic.StrategyDownload=الخيار الأول: تحميل كل المكونات المتوافقة المطلوبة (يدعم الإيقاف والاستكمال والتحقق SHA-256)
arabic.StrategyScan=الخيار الثاني: فحص البارتيشنات الموجودة (D:\AI\LMStudio-Models\local و E:\ و D:\) واستخدامها في مكانها بدون نقل
arabic.StrategyHybrid=الخيار الثالث: وضع مدمج — ربط الموديلات الموجودة وتحميل الناقص فقط

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#SourcePublishDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
var
  ModelStoragePage: TInputDirWizardPage;
  ModelStrategyPage: TInputOptionWizardPage;
  ScanRootsPage: TInputQueryWizardPage;

function JsonEscape(const Value: String): String;
begin
  Result := Value;
  StringChangeEx(Result, '\', '\\', True);
  StringChangeEx(Result, '"', '\"', True);
end;

function GetDefaultInstallDir(Param: String): String;
begin
  // Prefer the user's existing D: install volume; never default to a missing drive.
  if DirExists('D:\') then
    Result := 'D:\HAFIZ_In_Slang'
  else if DirExists('E:\') then
    Result := 'E:\HAFIZ_In_Slang'
  else
    Result := ExpandConstant('{autopf}\HAFIZ In Slang');
end;

function GetDefaultModelStoragePath(Param: String): String;
begin
  // Keep the preferred E: model volume when available, then D:, then LocalAppData.
  if DirExists('E:\\') then
    Result := 'E:\HAFIZ_Models'
  else if DirExists('D:\\') then
    Result := 'D:\HAFIZ_Models'
  else
    Result := ExpandConstant('{localappdata}\HAFIZ_Models');
end;

procedure InitializeWizard;
begin
  // Step: Select Model Storage Path (default E:\HAFIZ_Models)
  ModelStoragePage := CreateInputDirPage(
    wpSelectDir,
    ExpandConstant('{cm:ModelPathTitle}'),
    ExpandConstant('{cm:ModelPathSub}'),
    'Existing models discovered on other partitions will remain in-place and will not be copied or moved.',
    False,
    'HAFIZ_Models'
  );
  ModelStoragePage.Add('Model Storage Directory:');
  ModelStoragePage.Values[0] := GetDefaultModelStoragePath('');

  // Step: 3-Way Model Strategy (Download / Scan Partitions / Hybrid)
  ModelStrategyPage := CreateInputOptionPage(
    ModelStoragePage.ID,
    ExpandConstant('{cm:StrategyTitle}'),
    ExpandConstant('{cm:StrategySub}'),
    'You can change these preferences anytime inside Settings Center.',
    True,
    False
  );
  ModelStrategyPage.Add(ExpandConstant('{cm:StrategyDownload}'));
  ModelStrategyPage.Add(ExpandConstant('{cm:StrategyScan}'));
  ModelStrategyPage.Add(ExpandConstant('{cm:StrategyHybrid}'));
  ModelStrategyPage.SelectedValueIndex := 1; // Default: Scan existing local drives in-place

  // Step: Multi-drive scan paths
  ScanRootsPage := CreateInputQueryPage(
    ModelStrategyPage.ID,
    'Local Model Partitions & LM Studio Path',
    'Specify semicolon-separated drives or folders to scan in-place without moving files.',
    'Example: D:\AI\LMStudio-Models\local;E:\;D:\'
  );
  ScanRootsPage.Add('Scan Paths (semicolon-separated):', False);
  ScanRootsPage.Values[0] := 'D:\AI\LMStudio-Models\local;E:\;D:\';
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  BootstrapPath, JsonContent, StrategyName: String;
begin
  if CurStep = ssPostInstall then
  begin
    case ModelStrategyPage.SelectedValueIndex of
      0: StrategyName := 'download_all';
      1: StrategyName := 'scan_existing_in_place';
    else
      StrategyName := 'hybrid';
    end;

    ForceDirectories(ExpandConstant('{localappdata}\HAFIZ_In_Slang'));
    BootstrapPath := ExpandConstant('{localappdata}\HAFIZ_In_Slang\installer-bootstrap.json');
    JsonContent :=
      '{' + #13#10 +
      '  "installRootPath": "' + JsonEscape(ExpandConstant('{app}')) + '",' + #13#10 +
      '  "modelStoragePath": "' + JsonEscape(ModelStoragePage.Values[0]) + '",' + #13#10 +
      '  "modelSetupStrategy": "' + StrategyName + '",' + #13#10 +
      '  "scanRootsRaw": "' + JsonEscape(ScanRootsPage.Values[0]) + '",' + #13#10 +
      '  "preserveUserFilesOnUninstall": true' + #13#10 +
      '}';
    SaveStringToFile(BootstrapPath, Utf8Encode(JsonContent), False);
  end;
end;
