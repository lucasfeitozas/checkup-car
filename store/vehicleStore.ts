import { create } from "zustand";

export type Vehicle = {
  id: string;
  nickname: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  currentKm: number;
};

type VehicleState = {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Vehicle) => void;
  updateKm: (vehicleId: string, currentKm: number) => void;
};

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [
    {
      id: "seed-vehicle",
      nickname: "Meu carro",
      brand: "Toyota",
      model: "Corolla",
      year: 2022,
      plate: "ABC1D23",
      currentKm: 42000,
    },
  ],
  addVehicle(vehicle) {
    set((state) => ({
      vehicles: [vehicle, ...state.vehicles],
    }));
  },
  updateKm(vehicleId, currentKm) {
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, currentKm } : vehicle,
      ),
    }));
  },
}));
