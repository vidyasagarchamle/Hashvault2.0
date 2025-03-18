# Changelog

All notable changes to the HashVault project will be documented in this file.

## [Unreleased]

## [0.1.1] - 2023-03-13

### Fixed
- Resolved theme toggle functionality by removing `forcedTheme="dark"` property
- Fixed dashboard loading issues with proper client-side rendering
- Added fallback for storage usage component when API calls fail
- Fixed metadata implementation in layout.tsx to comply with Next.js standards
- Added ClientWrapper component for proper client-side rendering
- Improved error handling throughout the application

### Added
- Created client-wrapper.tsx for handling client-side mounting
- Added fallback UI for loading states

### Changed
- Refactored layout.tsx to use server components for metadata
- Updated dashboard page to handle wallet readiness more reliably
- Improved StorageUsage component with better error handling and fallbacks

## [0.1.0] - 2023-03-01

### Added
- Initial release of HashVault
- Decentralized storage functionality using IPFS
- User authentication with Privy
- File upload and download capabilities
- Storage usage tracking
- Dark/light mode toggle 