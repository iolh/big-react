import * as React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(999);
	return <div>{num}</div>;
}

function Child() {
	return <span>hello,neo!</span>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	(<App />) as any
);
