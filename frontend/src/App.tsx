import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});




function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}



function ReportModal({
  onClose,
  pickedLocation,
  roadName,
  setRoadName,
  isPinning,
  setIsPinning,
  handleUseMyLocation,
}: {
  onClose: () => void;
  pickedLocation: { lat: number; lng: number } | null;
  roadName: string;
  setRoadName: (name: string) => void;
  isPinning: boolean;
  setIsPinning: (val: boolean) => void;
  handleUseMyLocation: () => void;
}) {

  const [depthLevel, setDepthLevel] = useState('');
  const [passability, setPassability] = useState('');
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!pickedLocation) {
    alert('Please pin a location or use your current location first.');
    return;
  }
  if (!photos || photos.length === 0) {
    alert('At least one photo is required.');
    return;
  }

  const formData = new FormData();
  formData.append('lat', String(pickedLocation.lat));
  formData.append('lng', String(pickedLocation.lng));
  formData.append('road_name', roadName);
  formData.append('depth_level', depthLevel);
  formData.append('passability', passability);

  Array.from(photos).forEach((photo) => {
    formData.append('photos', photo);
  });

  if (video) {
    formData.append('video', video);
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to submit report');
    }

    const data = await response.json();
    console.log('Report submitted:', data);
    alert('Report submitted successfully!');
    onClose();
  } catch (error) {
    console.error(error);
    alert('Something went wrong submitting your report.');
  }
};

  if (isPinning) {
  return (
    <div className="fixed bottom-4 left-4 z-[2000] bg-white rounded-lg shadow-xl p-4 w-72">
      <p className="text-sm text-gray-600 mb-2">
        Tap the map to set the flood location, or use the button below.
      </p>
      {pickedLocation && (
        <p className="text-xs text-gray-500 mb-2">
          Picked: {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
        </p>
      )}
      <div className="flex gap-2">
        <button
          className="flex-1 bg-gray-100 text-gray-800 text-sm py-2 rounded hover:bg-gray-200"
          onClick={() => setIsPinning(false)}
        >
          Back to Form
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Report Flood</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
  <label className="block text-sm font-medium mb-1">Road Name / Location</label>
  <input
    type="text"
    value={roadName}
    onChange={(e) => setRoadName(e.target.value)}
    className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
    required
  />
  <div className="flex gap-2">
    <button
      type="button"
      className="flex-1 bg-gray-100 text-gray-800 text-sm py-2 rounded hover:bg-gray-200"
      onClick={() => setIsPinning(true)}
    >
      Pin on Map
    </button>
    <button
      type="button"
      className="flex-1 bg-gray-100 text-gray-800 text-sm py-2 rounded hover:bg-gray-200"
      onClick={handleUseMyLocation}
    >
      Use My Location
    </button>
  </div>
</div>

          <div>
            <label className="block text-sm font-medium mb-1">Depth Level</label>
            <select
              value={depthLevel}
              onChange={(e) => setDepthLevel(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select depth</option>
              <option value="ankle">Ankle</option>
              <option value="knee">Knee</option>
              <option value="waist">Waist</option>
              <option value="chest">Chest</option>
              <option value="above_head">Above Head</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Passability</label>
            <select
              value={passability}
              onChange={(e) => setPassability(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select passability</option>
              <option value="motorcycle"> Only Motorcycles and above can pass</option>
              <option value="sedan"> Only Sedans and above can pass</option>
              <option value="suv"> Only SUVs and above can pass</option>
              <option value="trucks"> Only Trucks can pass</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Photos (at least 1)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(e.target.files)}
              className="w-full text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Video (optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideo(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}


async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}




function createPhotoIcon(photoUrl: string) {
  return L.divIcon({
    html: `
      <div style="
        width: 70px;
        height: 70px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        overflow: hidden;
        background: #ddd;
      ">
        <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `,
    className: '',
    iconSize: [70, 70],
    iconAnchor: [35, 70],
  });
}

function PhotoCarousel({
  photos,
  onPhotoClick,
}: {
  photos: string[];
  onPhotoClick: (url: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const currentUrl = `${import.meta.env.VITE_API_URL}/${photos[currentIndex]}`;

  return (
    <div className="relative w-full">
      <img
        src={currentUrl}
        onClick={() => onPhotoClick(currentUrl)}
        className="w-full h-32 object-cover rounded cursor-pointer"
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center"
          >
            ‹
          </button>
          <button
            onClick={goNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center"
          >
            ›
          </button>
          <p className="text-xs text-center text-gray-500 mt-1">
            {currentIndex + 1} / {photos.length}
          </p>
        </>
      )}
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}


const hotlines = [
  {
    office: 'CDRRMO - San Fernando Rescue Unit',
    numbers: ['0459614357', '0456496076', '09399362423'],
  },
  {
    office: 'City of San Fernando Police Headquarters',
    numbers: ['09985985465', '09568205255'],
  },
  {
    office: 'Bureau of Fire Protection - San Fernando',
    numbers: ['09232359725'],
  },
  {
    office: 'City Public Order and Safety Coordinating Office',
    numbers: ['0456265065', '09678894569'],
  },
  {
    office: 'City Hall',
    numbers: ['0456498540'],
  },
  {
    office: 'Heroes Hall',
    numbers: ['0456498080'],
  },
  {
    office: 'National Emergency Hotline',
    numbers: ['911'],
  },
];

function formatDisplay(number: string) {
  if (number.length <= 4) return number;
  return number.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
}

function HotlinesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-red-700">Emergency Hotlines</h2>
        <div className="flex flex-col gap-4">
          {hotlines.map((entry) => (
            <div key={entry.office}>
              <p className="font-semibold text-sm mb-1">{entry.office}</p>
              <div className="flex flex-col gap-1">
                {entry.numbers.map((number) => (
                  <a
                    key={number}
                    href={`tel:${number}`}
                    className="bg-red-600 text-white text-center py-2 rounded hover:bg-red-700"
                  >
                    Call {formatDisplay(number)}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





function MapView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const [roadName, setRoadName] = useState('');
  const [approvedReports, setApprovedReports] = useState<any[]>([]);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [showHotlines, setShowHotlines] = useState(false);



useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/api/reports`)
    .then((res) => res.json())
    .then((data) => setApprovedReports(data))
    .catch((err) => console.error('Failed to fetch reports:', err));
}, []);

useEffect(() => {
  if (pickedLocation) {
    reverseGeocode(pickedLocation.lat, pickedLocation.lng).then(setRoadName);
  }
}, [pickedLocation]);
  
  const handleUseMyLocation = () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setPickedLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      console.error(error);
      alert('Could not get your location. Please allow location access or pin manually.');
    }
  );
};



  return (
    
    <div className="relative w-screen h-screen">
      <MapContainer
        center={[15.03860, 120.68091]}
        zoom={13}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationPicker onPick={(lat, lng) => setPickedLocation({ lat, lng })} />
        {pickedLocation && (
          <Marker position={[pickedLocation.lat, pickedLocation.lng]} />
          
        )}

{approvedReports.map((report) => (
  <Marker
    key={report.id}
    position={[report.lat, report.lng]}
    icon={
      report.photos && report.photos.length > 0
        ? createPhotoIcon(`${import.meta.env.VITE_API_URL}/${report.photos[0]}`)
        : undefined
    }
  >
    <Popup>
      {<div className="max-w-[200px]">
    <p className="font-semibold">{report.road_name}</p>
    <p className="text-sm">Depth: {report.depth_level}</p>
    <p className="text-sm">Passability: {report.passability}</p>
    <p className="text-sm">When:{formatDate(report.reported_at)}</p>

    {report.photos && report.photos.length > 0 && (
      <div className="mt-2">
        <PhotoCarousel photos={report.photos} onPhotoClick={setFullscreenPhoto} />
      </div>


      
    )}

    {report.video_path && (
      <video
        controls
        src={`${import.meta.env.VITE_API_URL}/${report.video_path}`}
        className="w-full mt-2 rounded"
      />
    )}
  </div>}
    </Popup>
  </Marker>
))}
      </MapContainer>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 px-5 py-2 rounded-lg shadow-lg text-center max-w-[90vw]">
      <h1 className="text-lg font-bold text-blue-800">FLOOD MAP</h1>
      <p className="text-xs text-gray-600">Report and view flood conditions in San Fernando</p>
      </div>

      <button
        className="absolute top-4 right-4 z-[1000] bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700"
        onClick={() => setIsModalOpen(true)}
      >
        Report Flood
      </button>


      <button
      className="absolute bottom-4 right-4 z-[1000] bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-red-700"
      onClick={() => setShowHotlines(true)}
      >
      Hotlines
      </button>

{showHotlines && <HotlinesModal onClose={() => setShowHotlines(false)} />}

      <button
      className="absolute top-4 right-40 z-[1000] bg-white text-gray-800 font-semibold px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100"
      onClick={handleUseMyLocation}
      >
        Use My Location
      </button>



      {pickedLocation && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white px-3 py-2 rounded shadow text-sm">
          Picked: {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
        </div>
      )}

      {isModalOpen && (
  <ReportModal
    onClose={() => setIsModalOpen(false)}
    pickedLocation={pickedLocation}
    roadName={roadName}
    setRoadName={setRoadName}
    isPinning={isPinning}
    setIsPinning={setIsPinning}
    handleUseMyLocation={handleUseMyLocation}
  />
)}

{fullscreenPhoto && (
  <div
    className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center"
    onClick={() => setFullscreenPhoto(null)}
  >
    <button
      className="absolute top-4 right-4 text-white text-3xl"
      onClick={() => setFullscreenPhoto(null)}
    >
      ✕
    </button>
    <img
      src={fullscreenPhoto}
      className="max-w-[90vw] max-h-[90vh] object-contain"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
)}
</div>
);
}







function AdminPage() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [reports, setReports] = useState<any[]>([]);
  const [approvedReports, setApprovedReports] = useState<any[]>([]);

  

  const fetchApproved = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`);
      const data = await response.json();
      setApprovedReports(data);
    } catch (error) {
      console.error('Failed to fetch approved reports:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/pending`, {
        headers: { 'x-admin-password': password },
      });

      if (response.status === 401) {
        setLoginError('Incorrect password.');
        return;
      }

      if (!response.ok) {
        setLoginError('Something went wrong. Please try again.');
        return;
      }

      const data = await response.json();
      setReports(data);
      setIsLoggedIn(true);
    } catch (error) {
      console.error(error);
      setLoginError('Could not reach the server.');
    }
  };

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        alert('Failed to update report status.');
        return;
      }

      setReports((prev) => prev.filter((report) => report.id !== id));
    } catch (error) {
      console.error(error);
      alert('Could not reach the server.');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Permanently delete this report? This cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });

      if (!response.ok) {
        alert('Failed to delete report.');
        return;
      }

      setApprovedReports((prev) => prev.filter((report) => report.id !== id));
    } catch (error) {
      console.error(error);
      alert('Could not reach the server.');
    }
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === 'approved') {
      fetchApproved();
    }
  }, [isLoggedIn, activeTab]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
        >
          <h1 className="text-xl font-bold mb-4">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
            required
          />
          {loginError && (
            <p className="text-red-600 text-sm mb-3">{loginError}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
          >
            Log In
          </button>
        </form>
      </div>
    );
  }

  const displayedReports = activeTab === 'pending' ? reports : approvedReports;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded font-medium ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded font-medium ${
            activeTab === 'approved'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Approved
        </button>
      </div>

      {displayedReports.length === 0 && (
        <p className="text-gray-500">
          {activeTab === 'pending' ? 'No pending reports.' : 'No approved reports.'}
        </p>
      )}

      <div className="grid gap-4">
        {displayedReports.map((report) => (
          <div key={report.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="font-semibold">{report.road_name}</p>
            <p className="text-sm text-gray-600">
              Depth: {report.depth_level} | Passability: {report.passability}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {report.photos.map((photoPath: string, index: number) => (
                <img
                  key={index}
                  src={`${import.meta.env.VITE_API_URL}/${photoPath}`}
                  className="w-24 h-24 object-cover rounded"
                />
              ))}
            </div>
            {report.video_path && (
              <video
                controls
                src={`${import.meta.env.VITE_API_URL}/${report.video_path}`}
                className="w-64 mt-2 rounded"
              />
            )}

            {activeTab === 'pending' ? (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleStatusUpdate(report.id, 'approved')}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(report.id, 'rejected')}
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleDelete(report.id)}
                  className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}






import { Routes, Route } from 'react-router-dom';










function App() {
  return (
    <Routes>
      <Route path="/" element={<MapView />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;