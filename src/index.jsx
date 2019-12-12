import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// State machine
import { Link, Machine, State, Transition } from './machine';

const Generic = (title) => ({ children, history, machine, match }) => (
    <div className={title && title.toLowerCase().replace(/\s/g, '')}>
        <h1>{title}</h1>
        {children}
    </div>
);
const GenericWithLinks = (title) => ({ children, history, machine, match }) => (
    <div className={title && title.toLowerCase().replace(/\s/g, '')}>
        <h1>{title} {match.params.stockNumber}</h1>
        {children}
        <Link event='reload'>Reload (State event)</Link>
        <br/>
        <Link href='/'>Reload (URL push - WIP)</Link>
    </div>
);
const App = Generic('App');
const StockNumber = GenericWithLinks('StockNumber');
const Error = GenericWithLinks('Error');
const Loading = Generic('Loading');
const NotFound = GenericWithLinks('Not Found');
const Step1 = ({ children, machine }) => <div className='step-1'>
    <h1>Step 1</h1>
    {children}
    <Link event='continue'>Continue</Link>
</div>
const Step2 = ({ children, machine }) => <div className='step-2'>
    <h1>Step 2</h1>
    {children}
    <Link event='continue'>Continue</Link>
    <br/>
    <Link event='reload'>Back to Step 1 (State Event)</Link>
</div>
const Step3 = ({ children, machine }) => <div className='step-3'>
    <h1>Step 3</h1>
    {children}
    <Link event='continue'>Continue</Link>
</div>
const SubStep = Generic('Sub-Step');
const Submitting = Generic('Submitting');

const fetchData = ({ send }) => new Promise((resolve, reject) => {
    const rng = Math.random() >= 0.5 ? true : false;
    setTimeout(() => rng ? resolve(8675309) : reject(), 1500);
    send('fetch');
}).then(res => send('resolve', { params: { stockNumber: res }}))
.catch(err => send('reject'));

ReactDOM.render(
    <div className='container'>
        <Machine id='checkout' path='/checkout'>
            <State component={App} id='app' invoke={fetchData}>
                {/* <Transition event='fetch' target='loading'/> */}
                <Transition event='reject' target='error'/>
                <Transition event='resolve' target='stockNumber'/>
                <State component={Loading} id='loading'/>
                <State component={StockNumber} initial id='stockNumber' path='/:stockNumber'>
                    <Transition event='reload' target='app'/>
                    <State component={Step1} id='step-1' path='/step-1'>
                        <Transition event='continue' target='step-2'/>
                    </State>
                    <State component={Step2} initial id='step-2' path='/step-2'>
                        <Transition event='reload' target='step-1'/>
                        <Transition event='reload' target='app'/>
                        <Transition event='continue' target='step-3'/>
                        <State component={SubStep} initial id='sub-step'/>
                    </State>
                    <State component={Step3} id='step-3' path='/step-3'>
                        <Transition event='reload' target='step-1'/>
                        <Transition event='submit' target='submit'/>
                    </State>
                    <State component={Submitting} id='submitting'>
                        <Transition event='resolve' target='done'/>
                        <Transition event='reject' target='error'/>
                    </State>
                </State>
            </State>
            <State component={Error} id='error'>
                <Transition event='reload' target='app'/>
            </State>
            <State component={NotFound} id='*' path='/404'>
                <Transition event='reload' target='app'/>
            </State>
        </Machine>
    </div>
, document.getElementById('root'));
