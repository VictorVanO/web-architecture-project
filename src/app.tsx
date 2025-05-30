import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { MetaProvider, Title } from "@solidjs/meta";
import Nav from "~/components/Nav";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <>
          <MetaProvider>
            <Title>EatReal. - Vos quotidiens en repas</Title>
          </MetaProvider>
          <Nav />
          <Suspense>{props.children}</Suspense>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
