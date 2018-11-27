import React from 'react';
import { render } from 'react-dom';
import App from './app';
import { Provider } from 'react-redux';

import store from './store/index';

render(
    <div>
        <Provider store={store}>
            <App />
        </Provider>
    </div>,
    document.getElementById('root')
);
