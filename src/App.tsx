import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { Shell } from "./components/Shell";
import { Login } from "./views/Login";
import { Deck } from "./views/Deck";
import { Treasury } from "./views/Treasury";
import { Rails } from "./views/Rails";
import { Credit } from "./views/Credit";
import { Risk } from "./views/Risk";
import { Nodes } from "./views/Nodes";
import { Incidents } from "./views/Incidents";
import { Roster } from "./views/Roster";
import { Terminal } from "./views/Terminal";
import { Audit } from "./views/Audit";

function Gate() {
  const { operator } = useStore();
  if (!operator) return <Login />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Deck />} />
        <Route path="/treasury" element={<Treasury />} />
        <Route path="/rails" element={<Rails />} />
        <Route path="/credit" element={<Credit />} />
        <Route path="/risk" element={<Risk />} />
        <Route path="/nodes" element={<Nodes />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </StoreProvider>
  );
}
