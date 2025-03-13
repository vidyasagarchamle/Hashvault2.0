import { FileList } from '@/components/files/file-list';

export default function FilesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          My Files
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          View, download, and manage your uploaded files
        </p>
      </div>
      <FileList />
    </div>
  )
} 