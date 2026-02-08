import { useTrading } from "@/contexts/TradingContext";
import React, { useMemo, useRef, useState, useEffect } from "react";

/**
 * MetaTrader-like Left Sidebar:
 * - Left icon bar always visible
 * - Hamburger opens a floating menu panel
 * - Menu items can have submenus that open to the right
 */

const LeftSidebar = () => {
    const {
        activeTool,
        setActiveTool,
        showGrid,
        setShowGrid,
        snapToGrid,
        setSnapToGrid,
        chartObjects,
        setChartObjects,
        drawingsVisible,
        setDrawingsVisible,
        chartLocked,
        setChartLocked,
        theme,
        setTheme,
    } = useTrading();

    const [menuOpen, setMenuOpen] = useState(false);
    const [openSub, setOpenSub] = useState(null); // string key of submenu
    const [selectedSubItems, setSelectedSubItems] = useState({ chart: "Grid", colors: "Green & Red", lang: "English" }); // { [menuKey]: selectedLabel } - tick on right
    const panelRef = useRef(null);
    const subCloseTimerRef = useRef(null); // delay close when moving to submenu

    // close on outside click
    useEffect(() => {
        const onDown = (e) => {
            if (!menuOpen) return;
            const panel = panelRef.current;
            if (panel && !panel.contains(e.target)) {
                setMenuOpen(false);
                setOpenSub(null);
            }
        };
        window.addEventListener("mousedown", onDown);
        return () => window.removeEventListener("mousedown", onDown);
    }, [menuOpen]);

    // close on ESC
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setMenuOpen(false);
                setOpenSub(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const tools = useMemo(
        () => [
            {
                icon: (
                    <div
                        className="icon svelte-1qoe9jm"
                        style={{
                            width: "calc(var(--indent-half) * 6)",
                            height: "calc(var(--indent-half) * 6)",
                            cursor: "pointer",
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0h24v24H0z" fill="none" />
                            <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="currentColor" />
                        </svg>
                    </div>
                ),
                label: "Menu",
                description: "Opens/closes navigation menu",
            },
            {
                icon: (
                    <div
                        className="icon svelte-1qoe9jm"
                        style={{
                            width: "calc(var(--indent-half) * 6)",
                            height: "calc(var(--indent-half) * 6)",
                            cursor: "pointer",
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                                fill="currentColor"
                            />
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M20 13H15.874C15.5122 14.4056 14.4056 15.5122 13 15.874V20C13 20.2652 12.8946 20.5196 12.7071 20.7071C12.5196 20.8946 12.2652 21 12 21C11.7348 21 11.4804 20.8946 11.2929 20.7071C11.1054 20.5196 11 20.2652 11 20V15.874C9.59439 15.5122 8.4878 14.4056 8.12602 13H4C3.73478 13 3.48043 12.8946 3.29289 12.7071C3.10536 12.5196 3 12.2652 3 12C3 11.7348 3.10536 11.4804 3.29289 11.2929C3.48043 11.1054 3.73478 11 4 11H8.12602C8.4878 9.59439 9.59439 8.4878 11 8.12602V4C11 3.73478 11.1054 3.48043 11.2929 3.29289C11.4804 3.10536 11.7348 3 12 3C12.2652 3 12.5196 3.10536 12.7071 3.29289C12.8946 3.48043 13 3.73478 13 4V8.12602C14.4056 8.4878 15.5122 9.59439 15.874 11H20C20.2652 11 20.5196 11.1054 20.7071 11.2929C20.8946 11.4804 21 11.7348 21 12C21 12.2652 20.8946 12.5196 20.7071 12.7071C20.5196 12.8946 20.2652 13 20 13ZM12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10Z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                ),
                label: "Crosshair",
                description: "Precise cursor positioning for measurement on chart",
            },
            {
                icon: (
                    <div
                        className="icon svelte-1qoe9jm"
                        style={{
                            width: "calc(var(--indent-half) * 6)",
                            height: "calc(var(--indent-half) * 6)",
                            cursor: "pointer",
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                            <path fill="none" d="M0 0h24v24H0z" />
                            <path
                                fillRule="evenodd"
                                d="M19.054 7.988a2.988 2.988 0 0 1-1.31-.312l-10 10a3.027 3.027 0 1 1-1.38-1.381l10-10a2.994 2.994 0 1 1 2.69 1.693Zm-14 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm14-14a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
                                clipRule="evenodd"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                ),
                label: "Trend Line",
                description: "Draw trend line (drag from first point to second point)",
            },
            {
                icon: (
                    <div
                        className="icon svelte-1qoe9jm"
                        style={{
                            width: "calc(var(--indent-half) * 6)",
                            height: "calc(var(--indent-half) * 6)",
                            cursor: "pointer",
                        }}
                    >
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="m2.285 10.333 8.048-8.048a.977.977 0 1 1 1.381 1.381l-8.048 8.049a.977.977 0 0 1-1.381-1.382Zm10 10 8.048-8.048a.977.977 0 1 1 1.381 1.381l-8.048 8.049a.977.977 0 0 1-1.381-1.382ZM19 8a2.966 2.966 0 0 1-1.308-.312l-10 10c.202.408.307.857.308 1.312a3.03 3.03 0 1 1-1.693-2.689l10-10A2.993 2.993 0 1 1 19 8ZM5 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM19 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
                                fillRule="evenodd"
                                clipRule="evenodd"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                ),
                label: "Parallel Lines",
                description: "Draw two parallel trend lines (draw first line, then second)",
            },
            {
                icon: (
                    <div
                        className="icon svelte-1qoe9jm"
                        style={{
                            width: "calc(var(--indent-half) * 6)",
                            height: "calc(var(--indent-half) * 6)",
                            cursor: "pointer",
                        }}
                    >
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M21 15H3a1 1 0 0 1 0-2h18a1 1 0 0 1 0 2Zm-2-3a2.99 2.99 0 0 1-2.816-2H3a1 1 0 0 1 0-2h13.184A2.995 2.995 0 1 1 19 12Zm0-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm2-3H3a1 1 0 0 1 0-2h18a1 1 0 1 1 0 2ZM5 16a2.99 2.99 0 0 1 2.816 2H21a1 1 0 0 1 0 2H7.816A2.995 2.995 0 1 1 5 16Zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                                fillRule="evenodd"
                                clipRule="evenodd"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                ),
                label: "Fibonacci",
                description: "Draw Fibonacci retracement levels",
            },
            // {
            //     icon: (
            //         <div
            //             className="icon svelte-1qoe9jm"
            //             style={{
            //                 width: "calc(var(--indent-half) * 6)",
            //                 height: "calc(var(--indent-half) * 6)",
            //                 cursor: "pointer",
            //             }}
            //         >
            //             <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            //                 <path
            //                     d="M3 6C3 7.30622 3.83481 8.41746 5 8.82929V15.1707C3.83481 15.5825 3 16.6938 3 18C3 19.6569 4.34315 21 6 21C7.30622 21 8.41746 20.1652 8.82929 19H15.1707C15.5825 20.1652 16.6938 21 18 21C19.6569 21 21 19.6569 21 18C21 16.6938 20.1652 15.5825 19 15.1707V8.82929C20.1652 8.41746 21 7.30622 21 6C21 4.34315 19.6569 3 18 3C16.6938 3 15.5825 3.83481 15.1707 5H8.82929C8.41746 3.83481 7.30622 3 6 3C4.34315 3 3 4.34315 3 6Z"
            //                     fillRule="evenodd"
            //                     clipRule="evenodd"
            //                     fill="currentColor"
            //                 />
            //             </svg>
            //         </div>
            //     ),
            //     label: "Rectangle",
            //     description: "Draw support/resistance zone",
            // },
            // 5. Rectangle – must match ChartArea tools[5] = "rectangle"
            {
                icon: (
                    <>
                        <div
                            className="icon svelte-1qoe9jm"
                            style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                                cursor: "pointer",
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M3 6C3 7.30622 3.83481 8.41746 5 8.82929V15.1707C3.83481 15.5825 3 16.6938 3 18C3 19.6569 4.34315 21 6 21C7.30622 21 8.41746 20.1652 8.82929 19H15.1707C15.5825 20.1652 16.6938 21 18 21C19.6569 21 21 19.6569 21 18C21 16.6938 20.1652 15.5825 19 15.1707V8.82929C20.1652 8.41746 21 7.30622 21 6C21 4.34315 19.6569 3 18 3C16.6938 3 15.5825 3.83481 15.1707 5H8.82929C8.41746 3.83481 7.30622 3 6 3C4.34315 3 3 4.34315 3 6ZM6 7C6.55228 7 7 6.55228 7 6C7 5.44772 6.55228 5 6 5C5.44772 5 5 5.44772 5 6C5 6.55228 5.44772 7 6 7ZM17 15.1707V8.82929C16.1476 8.52801 15.472 7.85242 15.1707 7H8.82929C8.52801 7.85241 7.85241 8.52801 7 8.82929V15.1707C7.85241 15.472 8.52801 16.1476 8.82929 17H15.1707C15.472 16.1476 16.1476 15.472 17 15.1707ZM18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7ZM7 18C7 18.5523 6.55228 19 6 19C5.44772 19 5 18.5523 5 18C5 17.4477 5.44772 17 6 17C6.55228 17 7 17.4477 7 18ZM19 18C19 18.5523 18.5523 19 18 19C17.4477 19 17 18.5523 17 18C17 17.4477 17.4477 17 18 17C18.5523 17 19 17.4477 19 18Z" fillRule="evenodd" clipRule="evenodd" fill="currentColor" />
                            </svg>
                        </div>

                    </>
                ),
                label: 'Rectangle',
                description: 'Draw support/resistance zone (drag from corner to corner)',
            },
            {
                icon: (
                    <div
                        className="icon svelte-1qoe9jm"
                        style={{
                            width: "calc(var(--indent-half) * 6)",
                            height: "calc(var(--indent-half) * 6)",
                            cursor: "pointer",
                        }}
                    >
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 12h16M4 12v.01M16 12v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                ),
                label: "Price Level",
                description: "Add horizontal price line (click on chart)",
            },
            {
                icon: (
                    <div
                        className="icon svelte-1qoe9jm"
                        style={{
                            width: "calc(var(--indent-half) * 6)",
                            height: "calc(var(--indent-half) * 6)",
                            cursor: "pointer",
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 4V8H18V6H13V18H16V20H8V18H11V6H6V8H4V4H20Z" fill="currentColor" />
                        </svg>
                    </div>
                ),
                label: "Text",
                description: "Add text label on chart (coming soon)",
            },
            // 8. Eye – show/hide all drawings
            {
                icon: (
                    <>
                        <div
                            className="icon svelte-1qoe9jm"
                            style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                                cursor: "pointer",
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12.76 17.958c-.504.07-1.016.07-1.52 0C6.07 17.532 2 12.932 2 12c0-.977 4.48-6 10-6s10 5.043 10 6c0 .912-4.07 5.529-9.24 5.958ZM3.63 12a11.724 11.724 0 0 0 3.03 2.741 5.963 5.963 0 0 1 .02-5.492A11.7 11.7 0 0 0 3.63 12ZM12 7.57a4.443 4.443 0 1 0-.006 8.886A4.443 4.443 0 0 0 12 7.57Zm5.31 1.652a5.954 5.954 0 0 1 .01 5.546A11.45 11.45 0 0 0 20.37 12a11.525 11.525 0 0 0-3.06-2.778ZM12 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fillRule='evenodd' clipRule="evenodd" fill="currentColor" />
                            </svg>
                        </div>

                    </>
                ),
                label: 'Eye',
                description: 'Show or hide all drawing objects on chart',
            },
            // 9. Lock – lock chart (disable pan and zoom)
            {
                icon: (
                    <>
                        <div
                            className="icon svelte-1qoe9jm"
                            style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                                cursor: "pointer",
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M16 20H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 1.05-1.749A1.044 1.044 0 0 1 7 9a5 5 0 0 1 8.75-3.3 1.008 1.008 0 0 1-.09 1.411 1 1 0 0 1-1.41-.09A3 3 0 0 0 9 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2Zm0-9H8v7h8v-7Zm-4 2a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1Z" fillRule='evenodd' clipRule="evenodd" fill="currentColor" />
                            </svg>
                        </div>

                    </>
                ),
                label: 'Lock',
                description: 'Lock chart (disable pan and zoom)',
            },
            {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                ),
                label: "Delete",
                description: "Remove last drawn object from chart",
            },
            // bottom trio
            {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16M6 4v16M12 4v16M18 4v16" />
                    </svg>
                ),
                label: "Grid",
                description: "Toggle grid display on/off for chart alignment",
            },
            {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8" strokeWidth={2} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l-3 3m6-3l-3-3" />
                    </svg>
                ),
                label: "History",
                description: "Undo/redo actions and view action history",
            },
            {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="8" height="8" strokeWidth={2} />
                        <rect x="13" y="3" width="8" height="8" strokeWidth={2} />
                        <rect x="3" y="13" width="8" height="8" strokeWidth={2} />
                        <rect x="13" y="13" width="8" height="8" strokeWidth={2} />
                    </svg>
                ),
                label: "Layout",
                description: "Manage chart layouts and panel arrangements",
            },
        ],
        []
    );

    const handleToolClick = (index) => {
        const toolLabel = tools[index].label;

        if (toolLabel === "Menu") {
            setMenuOpen((v) => !v);
            setOpenSub(null);
            return;
        }

        if (toolLabel === "Grid") {
            setShowGrid(!showGrid);
            return;
        }

        if (toolLabel === "Magnet") {
            setSnapToGrid(!snapToGrid);
            setActiveTool(snapToGrid ? null : index);
            return;
        }

        if (toolLabel === "Delete") {
            if (chartObjects.length > 0) {
                const newObjects = [...chartObjects];
                newObjects.pop();
                setChartObjects(newObjects);
            }
            return;
        }

        if (toolLabel === "Eye") {
            setDrawingsVisible(!drawingsVisible);
            return;
        }

        if (toolLabel === "Lock") {
            setChartLocked(!chartLocked);
            return;
        }

        if (toolLabel === "Light Theme" || toolLabel === "Dark Theme") {
            const nextTheme = theme === "light" ? "dark" : "light";
            setTheme(nextTheme);
            // Close menu if open so it behaves like MT5
            setMenuOpen(false);
            setOpenSub(null);
            return;
        }

        setActiveTool(activeTool === index ? null : index);
    };

    const topTools = tools.slice(0, 12); // Menu..Delete
    const bottomTools = tools.slice(12); // Grid..Layout

    // ======= MetaTrader Menu data (like screenshots) =======
    const menu = [
        {
            key: "accounts",
            label: "Trading accounts",
            icon: (
                <>
                    {/* <div className="item submenu svelte-cji72g icon"> */}
                    <div className="icon svelte-1qoe9jm" style={{
                        width: "calc(var(--indent-half) * 6)",
                        height: "calc(var(--indent-half) * 6)",
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                            <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 14a6 6 0 0 0-5 2 8 8 0 0 0 5 2l5-2a6 6 0 0 0-5-2zm0-12a8 8 0 0 0-6 13 8 8 0 0 1 6-3 8 8 0 0 1 6 3 8 8 0 0 0-6-13zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="currentColor" />
                        </svg>
                    </div>
                    {/* </div>  */}
                </>
            ),
            submenu: [
                { label: "Connect to account", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> },

                {
                    label: "Open Demo account",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#CDFDDA" fillRule="evenodd" d="M14.5 13.103c1.836 0 3.667.723 5.5 2.14V19l-10.5.5-.5-4.257c1.833-1.417 3.664-2.14 5.5-2.14Z" clip-rule="evenodd" />
                                    <path fill="#00AC00" fillRule="evenodd" d="M9.53 15.469 9.5 19l10-.477v-3.032c-1.703-1.27-3.365-1.888-5-1.888-1.626 0-3.277.611-4.97 1.866Zm-.836-.622c1.895-1.465 3.83-2.244 5.806-2.244 1.975 0 3.91.78 5.806 2.244l.194.15v4.48l-12.03.545V15.02l.224-.173Z" clip-rule="evenodd" />
                                    <path fill="#CDFDDA" fillRule="evenodd" d="m7.736 13.701-.734 2.345L7.001 20H4.5a1 1 0 0 1-1-1v-4c1.412-.669 2.824-1.102 4.236-1.299Z" clip-rule="evenodd" />
                                    <path fill="#00AC00" fillRule="evenodd" d="m7.913 13.678-.475 1.086c-.988.111-1.87.308-2.646.59l-.29.11v3.529H7L7.002 20H4.5a1 1 0 0 1-1-1v-4c1.471-.697 2.942-1.138 4.413-1.322Z" clip-rule="evenodd" />
                                    <path fill="#CDFDDA" d="M14.5 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                                    <path fill="#00AC00" fillRule="evenodd" d="M14.5 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" clip-rule="evenodd" />
                                    <path fill="#00AC00" d="M11.471 11.979A4.992 4.992 0 0 1 9.5 8c0-.67.131-1.308.37-1.891a3.5 3.5 0 1 0 1.601 5.87Z" />
                                    <path fill="#CDFDDA" d="M9.586 7.07a2.5 2.5 0 1 0 1.153 4.226A4.981 4.981 0 0 1 9.5 8c0-.318.03-.63.086-.93Z" />
                                </svg>
                            </div>
                        </>
                    )
                },
            ],
        },
        {
            key: "chart",
            label: "Chart settings",
            icon: (
                <>
                    <div className="icon svelte-1qoe9jm" style={{
                        width: "calc(var(--indent-half) * 6)",
                        height: "calc(var(--indent-half) * 6)",
                    }}>

                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 3V9H11V18H9V21H7V18H5V9H7V3H9ZM17 3V6H19V16H17V19H15V16H13V6H15V3H17ZM17 8H15V14H17V8Z" stroke="currentColor" />

                        </svg>
                    </div>
                </>
            ),
            submenu: [
                { label: "Grid", icon: <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#a)"><path fillRule="evenodd" clip-rule="evenodd" d="M20 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6zm-2 3V6h-3v3h3zm-4-3h-4v2.999h4V6zM9 6H6v3l3-.001V6zm-3 4v4l3-.001v-4H6zm0 5v3h3v-3.001H6zm4 3h4v-3.001h-4V18zm5 0h3v-3h-3v3zm3-4v-4h-3v4h3zm-8-.001v-4h4v4h-4z" fill="currentColor" /></g></svg> },

                {
                    label: "Trade Orders",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="M4 9H20V10H4V9Z" fill="#3183FF" />
                                    <path d="M4 17H20V18H4V17Z" fill="#EA4C4C" />
                                    <react x="4" y="14" width="5" height="2" fill="#EA4C4C"></react>
                                    <react x="4" y="6" width="5" height="2" fill="#3183FF"></react>
                                </svg>
                            </div>
                        </>
                    )
                },
                {
                    label: "Trade Position",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="M16 10L12 5H20L16 10Z" fill="#D95852" />
                                    <path d="M16 10H20V11H4V10H16Z" fill="#D95852" />
                                    <path d="M20 13H4V14H8L4 19H12L8 14H20V13Z" fill="#4682F7" />
                                </svg>
                            </div>
                        </>
                    )
                },
                {
                    label: "Trade History",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="M4 19L8 14L12 19H4Z" fill="#3183FF" />
                                    <path d="M7 16L17.5 8" stroke="#3183FF" strokeDasharray="2 2" />
                                    <path d="M13 5L17 10L21 5H13Z" fill="#EA4C4C" />
                                </svg>
                            </div>
                        </>
                    )
                },
                {
                    label: "SL/TP Levels",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="m4.688 17.773-.375.91c.43.277.911.415 1.445.415.614 0 1.104-.15 1.469-.45.367-.299.55-.68.55-1.144 0-.258-.044-.491-.132-.7a1.568 1.568 0 0 0-.387-.55c-.17-.159-.446-.332-.828-.52-.727-.354-1.09-.695-1.09-1.023 0-.198.064-.358.191-.48.13-.126.313-.188.547-.188.396 0 .772.128 1.129.383l.309-.875c-.31-.248-.796-.371-1.457-.371-.508 0-.925.146-1.25.437a1.421 1.421 0 0 0-.485 1.102c0 .237.04.453.121.648.084.195.2.365.352.508.154.14.45.322.887.543.44.219.73.417.87.594.141.177.212.363.212.558 0 .417-.299.625-.895.625-.388 0-.782-.14-1.184-.422ZM8.68 13.277V19h3.601v-.902H9.695v-4.82H8.68ZM20 20H4v1h16v-1Z" fill="#EA4C4C" />
                                    <path d="M10.5 10V7.895c.193.018.346.027.46.027 1.548 0 2.321-.656 2.321-1.969 0-.588-.21-1.02-.629-1.297-.416-.278-1.076-.418-1.98-.418-.115 0-.51.015-1.188.043V10H10.5Zm0-3.008V5.16c.099-.013.202-.02.309-.02.955 0 1.433.298 1.433.891 0 .35-.107.602-.32.758-.214.154-.552.23-1.016.23-.099 0-.234-.009-.406-.027Z" fill="#3183FF" fillRule="evenodd" clip-rule="evenodd" />
                                    <path d="M6.914 10V5.18h1.902v-.903H4.078v.903h1.82V10h1.016ZM20 11H4v1h16v-1Z" fill="#3183FF" />
                                </svg>
                            </div>
                        </>
                    )
                },
                {
                    label: "Ask Price",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="m6.926 14-.418-1.16H4.547L4.148 14H3.02L5.3 8.2h.446l2.3 5.8h-1.12ZM5.523 9.95l-.687 2.113H6.21l-.688-2.114Zm2.86 3.734.375-.91c.4.28.795.421 1.183.421.597 0 .895-.208.895-.625a.886.886 0 0 0-.211-.558c-.14-.177-.431-.375-.871-.594-.438-.221-.733-.402-.887-.543a1.506 1.506 0 0 1-.351-.508 1.682 1.682 0 0 1-.121-.648c0-.443.161-.81.484-1.102.325-.291.742-.437 1.25-.437.661 0 1.147.123 1.457.37l-.309.876a1.909 1.909 0 0 0-1.129-.383c-.234 0-.416.062-.546.187a.635.635 0 0 0-.192.48c0 .33.363.67 1.09 1.024.383.188.659.361.828.52.17.156.298.34.387.55.088.209.133.442.133.7 0 .463-.184.845-.551 1.144-.365.3-.854.45-1.469.45a2.617 2.617 0 0 1-1.445-.414Zm7.613.316-1.594-2.438-.636.872V14H12.75V8.277h1.016v2.739l1.945-2.739h1.156l-1.793 2.5L17.211 14h-1.215ZM3 15h18v1H3z" fill="#C96057" />
                                </svg>
                            </div>
                        </>
                    )
                },
                {
                    label: "Chart Controls",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="M0 0h24v24H0z" fill="none" />
                                    <path d="M10 10L20 14L18 16L20 18L18 20L16 18L14 20L10 10Z" fill="currentColor" />
                                    <path d="M11.2574 18.9959C11.1719 18.9986 11.0861 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11C19 11.0599 18.9993 11.1196 18.998 11.1791L16.9574 10.2813C16.6023 7.3064 14.0705 5 11 5C7.68629 5 5 7.68629 5 11C5 14.191 7.49101 16.8002 10.6345 16.9891L11.2574 18.9959Z" fill="currentColor" />
                                </svg>
                            </div>
                        </>
                    )
                },

                { label: "Trade Notification", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> },

                { label: "Crosshair cursor", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" stroke="currentColor" strokeWidth="2" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> },

                { label: "Show OHLC", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 17V7M12 17v-6M17 17v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
            ],
        },
        {
            key: "oneclick",
            label: "One Click Trading",
            icon: (
                <>
                    <div className="icon svelte-1qoe9jm" style={{
                        width: "calc(var(--indent-half) * 6)",
                        height: "calc(var(--indent-half) * 6)",
                    }}>

                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.9914 12.3966L18.9885 11.5954C18.7789 7.91769 15.7302 5 12 5C8.13401 5 5 8.13401 5 12C5 15.7302 7.91769 18.7789 11.5954 18.9885L12.3966 20.9914C12.2651 20.9971 12.1329 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 12.1329 20.9971 12.2651 20.9914 12.3966ZM11 11L21 15L19 17L22 20L20 22L17 19L15 21L11 11Z" fill="currentColor" />
                        </svg>
                    </div>
                </>
            ),
        },
        {
            key: "theme",
            label: theme === "light" ? "Dark Theme" : "Light Theme",
            icon: (
                <>
                    <div className="icon svelte-1qoe9jm" style={{
                        width: "calc(var(--indent-half) * 6)",
                        height: "calc(var(--indent-half) * 6)",
                    }}>

                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="m4.408 12.954-2.265-.756a.209.209 0 0 1 0-.396l2.265-.755a.209.209 0 0 1 .276.198v1.51c0 .143-.14.244-.276.198ZM5.959 7.306 4.89 5.17c-.09-.18.1-.37.28-.28l2.136 1.068a.209.209 0 0 1 .054.334L6.293 7.36c-.1.101-.27.074-.334-.054ZM11.802 21.857l-.755-2.265a.209.209 0 0 1 .198-.276h1.51c.143 0 .244.14.198.276l-.755 2.265a.21.21 0 0 1-.396 0ZM11.802 2.143l-.755 2.265a.209.209 0 0 0 .198.276h1.51c.143 0 .244-.14.198-.276l-.755-2.265a.209.209 0 0 0-.396 0ZM18.83 19.11l-2.137-1.068a.209.209 0 0 1-.054-.335l1.068-1.068c.1-.1.27-.073.334.055l1.069 2.136c.09.18-.101.37-.28.28ZM16.693 5.958 18.83 4.89c.18-.09.37.1.28.28l-1.068 2.136a.209.209 0 0 1-.334.054l-1.068-1.068a.209.209 0 0 1 .054-.334ZM4.89 18.83l1.069-2.136a.209.209 0 0 1 .334-.055l1.068 1.068c.101.101.074.271-.054.335L5.171 19.11c-.18.09-.37-.1-.28-.28ZM21.857 12.198l-2.265.755a.209.209 0 0 1-.276-.198v-1.51c0-.143.14-.244.276-.198l2.265.755a.21.21 0 0 1 0 .396Z"
                                fill="#FEBC5A"
                            />
                            <circle cx="12" cy="12" r="5" fill="#FED05A" />
                        </svg>
                    </div>
                </>
            ),
        },
        {
            key: "colors",
            label: "Color Templates",
            icon: (
                <>
                    <div className="icon svelte-1qoe9jm" style={{
                        width: "calc(var(--indent-half) * 6)",
                        height: "calc(var(--indent-half) * 6)",
                    }}>

                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M20.775 8.992C20.922 9.638 21 10.31 21 11a8.354 8.354 0 0 0-.787 0c-1.467.072-2.422.564-3.082 1.283l-1.18-1.65c.761-.718 1.697-1.205 2.81-1.452A7 7 0 1 0 12 18c.396-.001.565-.082.63-.12.07-.042.17-.124.295-.34.218-.375.36-.835.534-1.49l1.518 1.822C14.485 19.102 13.705 20 12 20a9 9 0 1 1 8.775-11.008Z" clip-rule="evenodd" fill="currentColor" />
                            <circle cx="8.5" cy="12.5" r="1.5" fill="currentColor" />
                            <circle cx="9.5" cy="8.5" r="1.5" fill="currentColor" />
                            <circle cx="13.5" cy="7.5" r="1.5" fill="currentColor" />
                            <path d="M13.892 14.693c-2.034.46-2.59-1.07-2.892-4.693 3.85.352 5.232 1.05 4.697 3.012L20 17.192s.038 1.023-.361 1.447c-.463.49-1.687.361-1.687.361l-4.06-4.307Z" fill="currentColor" />
                        </svg>
                    </div>
                </>
            ),
            submenu: [

                {
                    label: "Green & Red",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="M17.0579 5.11914V7.08486H19.0236V17.8963H17.0579V20.8449H15.0922V17.8963H13.1265V7.08486H15.0922V5.11914H17.0579Z" fill="#ef5350" />
                                    <path d="M9.19522 7.08376V3.15234H7.22951V7.08376H5.26379V15.9295H7.22951V20.8438H9.19522V15.9295H11.1609V7.08376H9.19522Z" fill="#26a69a" />
                                </svg>
                            </div>
                        </>
                    )

                },
                {
                    label: "Blue & Red",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="M17.0579 5.11914V7.08486H19.0236V17.8963H17.0579V20.8449H15.0922V17.8963H13.1265V7.08486H15.0922V5.11914H17.0579Z" fill="#ff574d" />
                                    <path d="M9.19522 7.08376V3.15234H7.22951V7.08376H5.26379V15.9295H7.22951V20.8438H9.19522V15.9295H11.1609V7.08376H9.19522Z" fill="#578cf2" />
                                </svg>
                            </div>
                        </>
                    )

                },
                {
                    label: "Black & White",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="M17.0579 5.11914V7.08486H19.0236V17.8963H17.0579V20.8449H15.0922V17.8963H13.1265V7.08486H15.0922V5.11914H17.0579Z" fill="#7a7a7a" />
                                    <path d="M9.19522 7.08376V3.15234H7.22951V7.08376H5.26379V15.9295H7.22951V20.8438H9.19522V15.9295H11.1609V7.08376H9.19522Z" fill="#ffffff" />
                                </svg>
                            </div>
                        </>
                    )

                },
                {
                    label: "Neutral",
                    icon: (
                        <>
                            <div className="icon svelte-1qoe9jm" style={{
                                width: "calc(var(--indent-half) * 6)",
                                height: "calc(var(--indent-half) * 6)",
                            }}>

                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                    <path d="M17.0579 5.11914V7.08486H19.0236V17.8963H17.0579V20.8449H15.0922V17.8963H13.1265V7.08486H15.0922V5.11914H17.0579Z" fill="#c86a6a" />
                                    <path d="M9.19522 7.08376V3.15234H7.22951V7.08376H5.26379V15.9295H7.22951V20.8438H9.19522V15.9295H11.1609V7.08376H9.19522Z" fill="#76ac85" />
                                </svg>
                            </div>
                        </>
                    )

                },
            ],
        },
        {
            key: "lang",
            label: "Language",
            rightText: "EN",
            icon: (
                <>
                    <div className="icon svelte-1qoe9jm" style={{
                        width: "calc(var(--indent-half) * 6)",
                        height: "calc(var(--indent-half) * 6)",
                    }}>

                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /> */}
                            <path d="M17.9 17.39C17.64 16.59 16.89 16 16 16H15V13C15 12.4477 14.5523 12 14 12H8V10H10C10.5523 10 11 9.55228 11 9V7H13C14.1046 7 15 6.10457 15 5V4.59C17.93 5.77 20 8.64 20 12C20 14.08 19.2 15.97 17.9 17.39ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.78 4.21 10.21L9 15V16C9 17.1046 9.89543 18 11 18V19.93ZM12 2C6.47715 2 2 6.47715 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C6.8043 20.9464 9.34784 22 12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12C22 9.34784 20.9464 6.8043 19.0711 4.92893C17.1957 3.05357 14.6522 2 12 2Z" fill="currentColor" />
                        </svg>
                    </div>
                </>
            ),
            submenu: [
                { label: "English", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> },
                { label: "Arabic", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> },
                { label: "Bulgarian", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg> },
                { label: "Chinese Simplified", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg> },
                { label: "Chinese Traditional", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg> },
                { label: "Czech", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg> },
                { label: "Dutch", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg> },
                { label: "Urdu", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg> },
            ],
        },
        {
            key: "shortcuts",
            label: "Shortcuts",
            icon: (
                <>
                    <div className="icon svelte-1qoe9jm" style={{
                        width: "calc(var(--indent-half) * 6)",
                        height: "calc(var(--indent-half) * 6)",
                    }}>

                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 18H13V16H11V18ZM12 6C9.79 6 8 7.79 8 10H10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 12 11 11.75 11 15H13C13 12.75 16 12.5 16 10C16 7.79 14.21 6 12 6Z" fill="currentColor" />
                        </svg>
                    </div>
                </>
            ),
        },
        {
            key: "contact",
            label: "Contact us",
            icon: (
                <>
                    <div className="icon svelte-1qoe9jm" style={{
                        width: "calc(var(--indent-half) * 6)",
                        height: "calc(var(--indent-half) * 6)",
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 4C3.89543 4 3 4.89543 3 6V15C3 16.1046 3.89543 17 5 17H5.98719L6 21L13 17H19C20.1046 17 21 16.1046 21 15V6C21 4.89543 20.1046 4 19 4H5ZM6 6H18C18.5128 6 18.9355 6.38604 18.9933 6.88338L19 7V14C19 14.5128 18.614 14.9355 18.1166 14.9933L18 15H12.5339C12.4234 15 12.314 15.0183 12.21 15.0539L12.108 15.0952L8 17.0289V16C8 15.4872 7.61396 15.0645 7.11662 15.0067L7 15H6C5.48716 15 5.06449 14.614 5.00673 14.1166L5 14V7C5 6.48716 5.38604 6.06449 5.88338 6.00673L6 6Z" fillRule="evenodd" clip-rule="evenodd" fill="currentColor" />
                        </svg>
                    </div>
                </>
            ),
        },
        {
            key: "about",
            label: "About program",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
            ),
        },
    ];

    const MenuRow = ({ item }) => {
        const hasSub = !!item.submenu?.length;

        return (
            <div
                className="relative"
                onMouseEnter={() => {
                    if (subCloseTimerRef.current) {
                        clearTimeout(subCloseTimerRef.current);
                        subCloseTimerRef.current = null;
                    }
                    if (hasSub) setOpenSub(item.key);
                }}
                onMouseLeave={() => {
                    if (!hasSub) return;
                    subCloseTimerRef.current = setTimeout(() => setOpenSub(null), 120);
                }}
            >
                <button
                    type="button"
                    onClick={() => {
                        if (hasSub) setOpenSub((k) => (k === item.key ? null : item.key));
                        else {
                            if (item.key === "theme") {
                                setTheme((t) => (t === "light" ? "dark" : "light"));
                            }
                            setMenuOpen(false);
                            setOpenSub(null);
                        }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] ${isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-200 hover:bg-[#202933]"}`}
                >
                    <span className={`w-5 h-5 flex shrink-0 items-center justify-center ${isLight ? "text-slate-500" : "text-slate-400"}`}>{item.icon}</span>
                    <span className="flex-1 text-[15px]">{item.label}</span>

                    {item.rightText && <span className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{item.rightText}</span>}

                    {hasSub && (
                        <svg className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>

                {/* Submenu - opens on hover, close to parent (min gap), text not far */}
                {hasSub && openSub === item.key && (
                    <div className={`absolute top-0 left-full ml-0 w-52 min-w-44 rounded-md shadow-2xl overflow-hidden z-100 border ${isLight ? "bg-white border-slate-200" : "bg-[#262F3F] border-white/10"}`}>
                        <div className="py-1">
                            {item.submenu.map((s, idx) => {
                                const isSelected = selectedSubItems[item.key] === s.label || (s.selected && selectedSubItems[item.key] == null);
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSubItems((prev) => ({ ...prev, [item.key]: s.label }));
                                            console.log("Sub selected:", item.key, s.label);
                                        }}
                                        className={`w-full flex items-center gap-3 pl-3 pr-3 py-2 text-[13px] text-left ${isLight ? "text-slate-700 hover:bg-slate-100" : "text-slate-200 hover:bg-[#202933]"}`}
                                    >
                                        {/* Icon left (MT5 style - har item k pecha icon) */}
                                        <span className={`w-5 h-5 flex shrink-0 items-center justify-center ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                                            {s.icon || null}
                                        </span>
                                        <span className="flex-1 min-w-0">{s.label}</span>
                                        {/* Tick on right when selected - bilkul MT5 jaisa */}
                                        {isSelected && (
                                            <span className="w-5 h-5 flex shrink-0 items-center justify-center text-emerald-400">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const isLight = theme === "light";
    return (
        <div className="relative h-full">
            {/* Left icon rail */}
            <div className={`w-12 flex flex-col items-center py-3 h-full border-r ${isLight ? "bg-white border-slate-200" : "bg-primary border-slate-700"}`}>
                <div className="flex flex-col items-center gap-2">
                    {topTools.map((t, i) => (
                        <React.Fragment key={t.label}>
                            <button
                                onClick={() => handleToolClick(i)}
                                className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-150
                  ${(t.label === "Grid" && showGrid) ||
                                        (t.label === "Eye" && !drawingsVisible) ||
                                        (t.label === "Lock" && chartLocked) ||
                                        activeTool === i
                                        ? isLight ? "text-sky-600 bg-sky-100" : "text-sky-300 bg-slate-700"
                                        : isLight ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                                    }`}
                                title={`${t.label}: ${t.description}`}
                            >
                                {t.icon}
                            </button>

                            {t.label === "Text" && <div className={`w-8 border-t my-1 ${isLight ? "border-slate-200" : "border-slate-700"}`}></div>}
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex-1" />

                <div className="flex flex-col items-center gap-2 pb-1">
                    {bottomTools.map((t, idx) => {
                        const realIndex = 12 + idx;
                        return (
                            <button
                                key={t.label}
                                onClick={() => handleToolClick(realIndex)}
                                className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-150
                  ${(t.label === "Grid" && showGrid) ||
                                        (t.label === "Eye" && !drawingsVisible) ||
                                        (t.label === "Lock" && chartLocked) ||
                                        activeTool === realIndex
                                        ? isLight ? "text-sky-600 bg-sky-100" : "text-sky-300 bg-slate-700"
                                        : isLight ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                                    }`}
                                title={`${t.label}: ${t.description}`}
                            >
                                {t.icon}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Floating menu panel (MetaTrader style) */}
            {menuOpen && (
                <>
                    {/* soft overlay (click to close menu) */}
                    <div
                        className="fixed inset-0 z-40 bg-black/20"
                        onClick={() => { setMenuOpen(false); setOpenSub(null); }}
                        aria-hidden="true"
                    />

                    <div
                        ref={panelRef}
                        className={`absolute left-12 top-2 z-50 w-68 border shadow-2xl overflow-visible ${isLight ? "bg-white border-slate-200" : "bg-[#262F3F] border-white/10"}`}
                    >
                        {/* Header account block - MT5 style with diagonal green Demo tag */}
                        <div className={`relative px-4 py-3 border-b overflow-hidden ${isLight ? "bg-white border-slate-200" : "border-white/10 bg-[#262F3F]"}`}>
                            {/* Demo tag - diagonal ribbon like MT5 (green, tilted top-right corner) */}
                            <span
                                className="absolute top-0 right-0 inline-flex items-center justify-center  text-[11px] font-semibold uppercase tracking-wide text-white shadow-md"
                                title="Demo"
                                style={{
                                    backgroundColor: 'var(--color-fill-greenHover, #16a34a)',
                                    transform: 'rotate(45deg) translate(32%, -32%)',
                                    transformOrigin: 'center',
                                    minWidth: '5rem',
                                }}
                            >
                                Demo
                            </span>
                            <div className={`text-[16px] font-medium pr-12 ${isLight ? "text-slate-800" : "text-slate-100"}`}>Anjolie Macias</div>
                            <div className={`text-[12px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>5044488330 - MetaQuotes-Demo - Hedge</div>
                        </div>

                        {/* Menu list */}
                        <div className="py-2">
                            {menu.map((item) => (
                                <MenuRow key={item.key} item={item} />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default LeftSidebar;
