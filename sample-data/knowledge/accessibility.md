# Accessibility

**Last Reviewed:** January 10, 2026
**Owner:** James Okafor, Director of Product
**Approved Use:** May be shared with prospects, procurement offices, and accessibility review teams. The VPAT document is available upon request and may be distributed without restriction.

---

## Compliance Standard

The Northstar Analytics Platform is designed and tested to conform to the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standard, as published by the World Wide Web Consortium (W3C).

WCAG 2.1 Level AA is the accessibility standard referenced by:
- Section 508 of the Rehabilitation Act (US federal procurement)
- Americans with Disabilities Act (ADA) Title II and III
- European Accessibility Act (EAA)
- Accessibility for Ontarians with Disabilities Act (AODA)
- EN 301 549 (European ICT accessibility standard)

## VPAT (Voluntary Product Accessibility Template)

A current **VPAT** documenting the platform's conformance to WCAG 2.1 Level AA is on file and available upon request. The VPAT follows the **ITI VPAT 2.4 Rev** format and covers:

- WCAG 2.1 (Level A and AA success criteria)
- Section 508 (2017 refresh)
- EN 301 549 (2021)

The most recent VPAT was updated in **November 2025** to reflect Northstar Platform v8.2. VPATs are updated with each major platform release.

## Screen Reader Compatibility

The Northstar platform has been tested and verified for compatibility with the following screen readers:

| Screen Reader | Platform | Status |
|--------------|----------|--------|
| **JAWS** (2024, 2025) | Windows | ✅ Compatible |
| **NVDA** (2024.x) | Windows | ✅ Compatible |
| **VoiceOver** | macOS, iOS | ✅ Compatible |
| **TalkBack** | Android | Partial support (dashboard interactions limited) |

### Screen Reader Implementation Details
- All interactive elements have appropriate ARIA labels and roles
- Dynamic content updates are announced via ARIA live regions
- Data tables include proper header associations and summary attributes
- Chart visualizations include text alternatives describing the data and trends
- Modal dialogs trap focus appropriately and announce their purpose

## Keyboard Navigation

The Northstar platform supports **complete keyboard-only navigation** for all core functionality:

- **Tab/Shift+Tab:** Navigate between interactive elements in logical order
- **Enter/Space:** Activate buttons, links, and controls
- **Arrow keys:** Navigate within menus, dropdowns, data tables, and dashboard widgets
- **Escape:** Close modals, dialogs, and dropdown menus
- **Skip navigation links:** Allow keyboard users to bypass repetitive navigation and jump to main content
- **Focus indicators:** All focusable elements display a visible focus indicator that meets the WCAG 2.1 minimum contrast requirement

### Known Keyboard Navigation Limitations
- Drag-and-drop dashboard layout editing requires mouse interaction; an alternative keyboard-accessible layout editor is available via the "Accessible Layout Mode" setting
- Map visualizations support keyboard navigation for region selection but do not support keyboard-driven pan/zoom (zoom controls are keyboard accessible)

## Color and Visual Design

### Color Contrast
- All text and interactive elements meet the **WCAG 2.1 Level AA contrast ratios**:
  - Normal text: minimum 4.5:1 contrast ratio
  - Large text (18pt or 14pt bold): minimum 3:1 contrast ratio
  - UI components and graphical objects: minimum 3:1 contrast ratio
- High-contrast mode is available as a user preference, increasing all contrast ratios to meet Level AAA thresholds

### Color Independence
- Information is never conveyed by color alone; patterns, labels, and icons are used in conjunction with color
- Chart color palettes include a **colorblind-safe palette** option (deuteranopia, protanopia, and tritanopia safe) that can be set as a tenant-wide default or individual preference
- Status indicators use both color and iconography (e.g., ✅ green checkmark, ⚠️ yellow warning triangle, ❌ red X)

## Accessibility Audits

Northstar conducts **quarterly accessibility audits** of the platform:

| Audit Type | Frequency | Performed By |
|-----------|-----------|-------------|
| Automated scanning (axe, Lighthouse) | Every sprint (bi-weekly) | Northstar QA team |
| Manual expert review | **Quarterly** | Internal accessibility specialist |
| Assistive technology testing | **Quarterly** | Internal team using JAWS, NVDA, VoiceOver |
| External third-party audit | **Annually** | Independent accessibility consulting firm |

### Remediation Process
- Accessibility defects are prioritized alongside functional defects in the product backlog
- Critical accessibility barriers (WCAG Level A failures) are treated as **Severity 1** defects and addressed in the next hotfix release
- Significant accessibility issues (WCAG Level AA failures) are treated as **Severity 2** defects and addressed within one release cycle (typically 6–8 weeks)
- The product team maintains an Accessibility Conformance Report that tracks all known issues and remediation timelines

## Accessibility Settings

End users can configure the following accessibility preferences in their Northstar profile:

- **High-contrast mode:** Increases contrast ratios for all UI elements
- **Reduced motion:** Disables animations and transitions throughout the platform
- **Text size scaling:** Supports 100%, 125%, 150%, and 200% text scaling without loss of functionality
- **Colorblind-safe palettes:** Selectable chart color palettes designed for various types of color vision deficiency
- **Accessible layout mode:** Provides keyboard-accessible alternatives to drag-and-drop interactions
- **Screen reader optimized mode:** Simplifies complex visualizations and provides enhanced text alternatives

---

## Constraints and Caveats

- TalkBack (Android) support is partial; customers with significant Android mobile user populations should discuss specific requirements during Discovery.
- Drag-and-drop dashboard editing is not keyboard accessible in the default mode. Users must enable "Accessible Layout Mode" for keyboard-only dashboard editing.
- The colorblind-safe palette is available as an option but is not the default. Administrators can set it as the tenant default if needed.
- Accessibility conformance is assessed against the web application. Exported PDFs and Excel reports may not meet the same accessibility standards.
- Third-party embedded content (e.g., customer-provided custom JavaScript widgets) is not covered by Northstar's accessibility commitments.

---

## Suggested RFP Response Language

> Northstar Analytics Platform conforms to WCAG 2.1 Level AA accessibility standards. A current VPAT (ITI 2.4 Rev format) is available upon request. The platform is compatible with leading screen readers including JAWS, NVDA, and VoiceOver, and supports full keyboard-only navigation for all core functionality. Color contrast ratios meet AA standards, and colorblind-safe chart palettes are available. Northstar conducts quarterly accessibility audits including automated scanning, manual expert review, and assistive technology testing, with an annual third-party audit to ensure ongoing conformance.
