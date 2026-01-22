import { useParams } from 'react-router-dom';

export function FileView() {
  const params = useParams();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-3xl font-bold">File View</h1>
      <p className="text-muted-foreground">
        File content will be displayed here. Path: {params['*']}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        This page will be implemented in upcoming tasks.
      </p>
    </div>
  );
}
