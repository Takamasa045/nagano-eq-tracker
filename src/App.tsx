import { useRoute } from "./router";
import { Home } from "./pages/Home";
import { Istl } from "./pages/Istl";
import { Geology } from "./pages/Geology";
import "./App.css";

export default function App() {
  const route = useRoute();

  return (
    <div className="app" data-route={route}>
      {route === "home" && <Home />}
      {route === "istl" && <Istl />}
      {route === "geology" && <Geology />}
    </div>
  );
}
