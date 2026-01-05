export default function IntakeStart() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Start Intake Process
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to the intake process. Let's get started with your information.
        </p>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Begin
        </button>
      </div>
    </div>
  );
}