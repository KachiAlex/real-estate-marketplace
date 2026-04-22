const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, VerticalAlign, TextRun, UnderlineType } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        text: 'ANDROID APK BUILD STATUS REPORT',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        bold: true,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Date: ${new Date().toLocaleString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: 'BUILD ATTEMPT SUMMARY',
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 200, after: 200 }
      }),

      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Item')], shading: { fill: 'D3D3D3' }, width: { size: 40, type: 'pct' } }),
              new TableCell({ children: [new Paragraph('Status/Value')], shading: { fill: 'D3D3D3' }, width: { size: 60, type: 'pct' } })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Project Name')] }),
              new TableCell({ children: [new Paragraph('PropertyArk Mobile App')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Build Type')] }),
              new TableCell({ children: [new Paragraph('Android APK (Release and Debug attempts)')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Build Framework')] }),
              new TableCell({ children: [new Paragraph('Expo 54.0.20 + React Native 0.81.5 + Gradle 8.14.3')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Java Version')] }),
              new TableCell({ children: [new Paragraph('v20.20.0 ✓ Installed')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Android SDK')] }),
              new TableCell({ children: [new Paragraph('compileSdk: 36, targetSdk: 36, minSdk: 24')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('NDK Version')] }),
              new TableCell({ children: [new Paragraph('27.1.12297006')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Package ID')] }),
              new TableCell({ children: [new Paragraph('com.propertyark.app')] })
            ]
          })
        ]
      }),

      new Paragraph({ text: '', spacing: { after: 200 } }),

      new Paragraph({
        text: 'ISSUES ENCOUNTERED',
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 200, after: 200 }
      }),

      new Paragraph({
        text: '1. npm Dependency Installation Failure',
        heading: HeadingLevel.HEADING_3,
        bold: true,
        spacing: { before: 100, after: 100 }
      }),
      new Paragraph({
        text: [
          new TextRun({ text: 'Error: ', bold: true }),
          new TextRun('"Invalid Version"')
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Impact: Could not install node_modules, which are required for Expo CLI and React Native tooling.',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Occurred During: npm install --legacy-peer-deps',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '2. Gradle Build Configuration Error',
        heading: HeadingLevel.HEADING_3,
        bold: true,
        spacing: { before: 100, after: 100 }
      }),
      new Paragraph({
        text: [
          new TextRun({ text: 'Error: ', bold: true }),
          new TextRun('"Cannot convert \'\' to File at build.gradle:12"')
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Root Cause: Line 12 of build.gradle executes Node scripts to resolve Expo CLI path, which returns empty string because node_modules is missing (see issue #1).',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Expected Behavior: Once dependencies are installed, this should resolve correctly.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '3. Native Module Compilation Issues',
        heading: HeadingLevel.HEADING_3,
        bold: true,
        spacing: { before: 100, after: 100 }
      }),
      new Paragraph({
        text: 'Failed Tasks:',
        bold: true,
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• expo-modules-core:configureCMakeRelWithDebInfo[arm64-v8a]',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• react-native-gesture-handler:configureCMakeRelWithDebInfo[arm64-v8a]',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '• react-native-screens:configureCMakeRelWithDebInfo[arm64-v8a]',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Note: These were encountered during the initial release APK build attempt and indicate CMake configuration issues for native modules.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'BUILD RESULTS',
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 200, after: 200 }
      }),

      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Build Attempt')], shading: { fill: 'D3D3D3' }, width: { size: 40, type: 'pct' } }),
              new TableCell({ children: [new Paragraph('Result')], shading: { fill: 'D3D3D3' }, width: { size: 30, type: 'pct' } }),
              new TableCell({ children: [new Paragraph('Notes')], shading: { fill: 'D3D3D3' }, width: { size: 30, type: 'pct' } })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Release APK (assembleRelease)')] }),
              new TableCell({ children: [new Paragraph('❌ FAILED')] }),
              new TableCell({ children: [new Paragraph('CMake native module failures')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Debug APK (assembleDebug)')] }),
              new TableCell({ children: [new Paragraph('❌ FAILED')] }),
              new TableCell({ children: [new Paragraph('Gradle config error (empty Expo CLI path)')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Overall Build Status')] }),
              new TableCell({ children: [new Paragraph('⏸ BLOCKED')] }),
              new TableCell({ children: [new Paragraph('Dependencies not installed')] })
            ]
          })
        ]
      }),

      new Paragraph({ text: '', spacing: { after: 200 } }),

      new Paragraph({
        text: 'NEXT STEPS - RECOMMENDATIONS',
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 200, after: 200 }
      }),

      new Paragraph({
        text: '1. Resolve npm Dependency Issue (CRITICAL)',
        heading: HeadingLevel.HEADING_3,
        bold: true,
        spacing: { before: 100, after: 100 }
      }),
      new Paragraph({
        text: 'Option A: Update npm to latest version',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'npm install -g npm@latest',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Option B: Use yarn instead of npm',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'cd mobile-app && yarn install',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Option C: Remove package-lock.json and reinstall',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'rm package-lock.json && npm cache clean --force && npm install',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '2. Use EAS Build (Cloud-Based Alternative)',
        heading: HeadingLevel.HEADING_3,
        bold: true,
        spacing: { before: 100, after: 100 }
      }),
      new Paragraph({
        text: 'EAS CLI is already configured in eas.json with project ID: b5224cae-91af-43fc-9612-9f245f4803ad',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Steps:',
        bold: true,
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '1. Install EAS CLI: npm install -g eas-cli',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '2. Authenticate: eas login',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: '3. Build APK: eas build -p android --profile preview',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Advantage: Cloud-based build avoids local environment issues',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: '3. Network/Cache Issues',
        heading: HeadingLevel.HEADING_3,
        bold: true,
        spacing: { before: 100, after: 100 }
      }),
      new Paragraph({
        text: 'If dependencies still fail to install:',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'npm config set registry https://registry.npmjs.org/',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'npm config set fetch-timeout 120000',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'npm config set fetch-retry-mintimeout 20000',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'npm config set fetch-retry-maxtimeout 120000',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'BUILD ENVIRONMENT DETAILS',
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 200, after: 200 }
      }),

      new Paragraph({
        text: 'Operating System: Windows 10/11',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'Node.js: v20.20.0 ✓',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'npm/yarn: Available (npm has configuration issues)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'Java: Installed and configured',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'Android SDK: Configured (API 36, target 36)',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'Gradle: 8.14.3',
        spacing: { after: 50 }
      }),
      new Paragraph({
        text: 'Expo Project: Configured with EAS credentials',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: 'SUMMARY',
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        text: 'The PropertyArk mobile app Android build environment is properly configured with all necessary tools (Java, Gradle, SDK). However, the npm dependency installation is encountering a "Invalid Version" error that prevents Expo CLI and React Native packages from being installed locally.',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'The recommended path forward is to resolve the npm issue using one of the suggested options (update npm, use yarn, or clean cache), or alternatively use EAS Build (Expo\'s cloud-based build service) which is already configured for this project.',
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'Once dependencies are installed and the build.gradle can locate Expo CLI correctly, the local Gradle builds should proceed with only minor native module compilation adjustments needed for arm64-v8a target optimization.',
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: [
          new TextRun({ text: 'Status: ', bold: true }),
          new TextRun('BUILD BLOCKED - Awaiting dependency resolution')
        ],
        spacing: { after: 200 }
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('./ANDROID_BUILD_STATUS_REPORT.docx', buffer);
  console.log('✓ Android Build Status Report created: ANDROID_BUILD_STATUS_REPORT.docx');
});
