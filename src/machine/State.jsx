import React, { useContext, useEffect, useMemo, useState } from 'react';
import { MachineContext } from './Machine';
import { getChildrenOfType, getChildStateNodes, isCurrentStack, isExactStack } from './util';

export const StateNodeContext = React.createContext({
    // id: null,
    path: null,
    stack: null
});
StateNodeContext.displayName = 'StateNode';

function State(props) {
    const { children, component: WrappedComponent, id, initial, invoke, onEntry, onExit, path, type } = props;
    const machineContext = useContext(MachineContext);
    const { _event: machineEvent, current, history, id: machineId, params, resolvePath, resolveState, send: machineSend } = machineContext;
    const { path: parentPath, stack } = useContext(StateNodeContext);
    const stackPath = path ? parentPath ? parentPath + path : path : parentPath;
    const match = isCurrentStack(id, current) ? {
        exact: isExactStack(id, current),
        params,
        path: stackPath,
        url: history.location.pathname
    } : false;

    const { _type, initialChild } = useMemo(() => {
        let _type = type;
        const childStates = getChildStateNodes(children);
        const initialChild = childStates.find(c => c.props.initial) || childStates[0];

        if (_type !== 'parallel') {
            if (!childStates.length) {
                _type = 'atomic';
            } else if (childStates.length > 1) {
                _type = 'compound';
            } else {
                _type = 'default';
            }
        }

        return {
            _type,
            initialChild
        }
    }, [ children ]);

    useMemo(() => {
        if (match) {
            if (_type === 'atomic') {
                // console.log('resolvePath', stackPath);
                // stackPath && resolvePath(stackPath);
            } else if (match.exact && initialChild) {
                // resolveState(initialChild.props.id);
            }
        }
    }, [ current ]);

    useEffect(() => {
        if (match) {
            invoke && invoke(machineContext);
        }
    }, []);

    const initialContext = {
        path: stackPath,
        // stack,
        send: machineSend
    }
    const componentProps = {
        children,
        history,
        machine: {
            current,
            // events,
            send: machineSend
        },
        match
    }

    // console.log('render', current);

    // useEffect(() => {
    //     console.log('useEffect', current);
    // });

    return match ?
        <StateNodeContext.Provider value={initialContext}>
            { WrappedComponent ?
                <WrappedComponent {...componentProps}/>
            : children }
        </StateNodeContext.Provider>
    : null;
}

export default State;
