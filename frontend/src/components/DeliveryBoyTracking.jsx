import React from 'react';
import scooter from "../assets/scooter.png";
import home from "../assets/home.png";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';

const deliveryBoyIcon = new L.Icon({
    iconUrl: scooter,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

const customerIcon = new L.Icon({
    iconUrl: home,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

function DeliveryBoyTracking({ data }) {
    const deliveryBoyLat = data?.deliveryBoyLocation?.lat || 25.5941;
    const deliveryBoyLon = data?.deliveryBoyLocation?.lon || 85.1376;

    const customerLat = data?.deliveryAddress?.latitude || 25.5941;
    const customerLon = data?.deliveryAddress?.longitude || 85.1376;

    const path = [
        [deliveryBoyLat, deliveryBoyLon],
        [customerLat, customerLon]
    ];

    const center = [deliveryBoyLat, deliveryBoyLon];

    return (
        <div className='w-full h-[400px] mt-3 rounded-xl overflow-hidden shadow-md'>
            <MapContainer className="w-full h-full" center={center} zoom={13}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Delivery Boy */}
                <Marker position={[deliveryBoyLat, deliveryBoyLon]} icon={deliveryBoyIcon}>
                    <Popup>Delivery Boy 🚴</Popup>
                </Marker>

                {/* Customer */}
                <Marker position={[customerLat, customerLon]} icon={customerIcon}>
                    <Popup>Customer Location 📍</Popup>
                </Marker>

                {/* Path */}
                <Polyline positions={path} color='blue' weight={4} />
            </MapContainer>
        </div>
    );
}

export default DeliveryBoyTracking;