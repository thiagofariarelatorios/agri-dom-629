import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useData } from './DataContext';
import { RoomStatus, Reservation, ReservationStatus } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from './icons';

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getDaysArray = (start: Date, count: number): Date[] => {
    return Array.from({ length: count }, (_, i) => addDays(start, i));
};

const dateDiffInDays = (a: Date, b: Date): number => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};

const formatDateRange = (start: Date, end: Date): string => {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();

    let startStr: string;
    const endStr = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(end);
    
    if (startYear !== endYear) {
        startStr = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(start);
    } else if (startMonth !== endMonth) {
        startStr = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(start);
    } else {
        startStr = new Intl.DateTimeFormat('pt-BR', { day: 'numeric' }).format(start);
    }

    return `${startStr} – ${endStr}`;
};

const getStatusColor = (status: ReservationStatus): string => {
    switch (status) {
        case 'reserved':
            return 'bg-orange-400';
        case 'confirmed':
        case 'confirmed_advance':
            return 'bg-green-500';
        case 'occupied':
        case 'occupied_partial':
        case 'occupied_full':
            return 'bg-blue-500';
        case 'checked-out_invoiced':
            return 'bg-yellow-500';
        case 'checked-out_paid':
            return 'bg-slate-700';
        case 'checked-out':
            return 'bg-gray-500';
        case 'cancelled':
        case 'no_show':
            return 'bg-red-500';
        default:
            return 'bg-gray-400';
    }
};

const getReservationGradient = (colorClass: string): string => {
    const colorMap: { [key: string]: string } = {
        'bg-green-500': 'bg-gradient-to-br from-green-400 to-cyan-500',
        'bg-blue-500': 'bg-gradient-to-br from-blue-400 to-indigo-500',
        'bg-yellow-500': 'bg-gradient-to-br from-yellow-400 to-amber-500',
        'bg-slate-700': 'bg-gradient-to-br from-slate-600 to-gray-700',
        'bg-orange-400': 'bg-gradient-to-br from-orange-400 to-red-500',
        'bg-red-500': 'bg-gradient-to-br from-red-500 to-rose-500',
        'bg-gray-500': 'bg-gradient-to-br from-slate-400 to-gray-500',
    };
    return colorMap[colorClass] || colorClass; // Fallback to original color
};

const getRoomStatusRowClass = (status: RoomStatus): string => {
    switch (status) {
        case 'Sujo':
            return 'bg-yellow-50';
        case 'Manutenção':
            return 'bg-rose-50';
        default:
            return 'bg-white';
    }
};


interface DraggingInfo {
    reservation: Reservation;
    duration: number;
    timelineGridRect: DOMRect;
    rowHeight: number;
    dayWidth: number;
}

export const CalendarView: React.FC = () => {
    const { rooms, reservations, guests, updateRoomStatus, openModal, updateReservation, currentUser } = useData();
    const [viewStartDate, setViewStartDate] = useState(new Date('2025-07-06T00:00:00Z'));
    const [viewDays, setViewDays] = useState(7);
    const [draggingInfo, setDraggingInfo] = useState<DraggingInfo | null>(null);
    const [dropTarget, setDropTarget] = useState<{ roomIndex: number; dayIndex: number } | null>(null);
    const [dayWidth, setDayWidth] = useState(100);
    const timelineGridRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const rowHeight = 80; // Fixed row height in pixels

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    
    const days = useMemo(() => getDaysArray(viewStartDate, viewDays), [viewStartDate, viewDays]);

    useEffect(() => {
        const calculateDayWidth = () => {
            if (timelineGridRef.current) {
                setDayWidth(timelineGridRef.current.offsetWidth / viewDays);
            }
        };
        calculateDayWidth();
        window.addEventListener('resize', calculateDayWidth);
        return () => window.removeEventListener('resize', calculateDayWidth);
    }, [viewDays]);


    const getGuestName = (guestId: string) => guests.find(g => g.id === guestId)?.name || 'Desconhecido';

    const handlePrev = () => setViewStartDate(addDays(viewStartDate, -viewDays));
    const handleNext = () => setViewStartDate(addDays(viewStartDate, viewDays));
    const handleToday = () => setViewStartDate(new Date(new Date().setHours(0,0,0,0)));

    const dateRangeString = useMemo(() => {
        const endDate = addDays(viewStartDate, viewDays - 1);
        return formatDateRange(viewStartDate, endDate);
    }, [viewStartDate, viewDays]);

    const handleMouseUp = useCallback(() => {
        if (draggingInfo && dropTarget) {
            const { reservation } = draggingInfo;
            const { roomIndex, dayIndex } = dropTarget;

            const targetRoom = rooms[roomIndex];
            const newStartDate = addDays(viewStartDate, dayIndex);
            
            const originalStartDate = new Date(reservation.startDate + 'T00:00:00Z');
            const isSameDay = dateDiffInDays(originalStartDate, newStartDate) === 0;
            const isSameRoom = reservation.roomId === targetRoom.id;

            if (!isSameDay || !isSameRoom) {
                 const duration = dateDiffInDays(new Date(reservation.startDate), new Date(reservation.endDate));
                const newEndDate = addDays(newStartDate, duration);
                const originalGuest = guests.find(g => g.id === reservation.guestId)?.name;
                const originalRoom = rooms.find(r => r.id === reservation.roomId)?.name;
                 
                openModal('confirmation', {
                    message: `Deseja mover a reserva de ${originalGuest} do quarto ${originalRoom} para o quarto ${targetRoom.name} a partir de ${newStartDate.toLocaleDateString('pt-BR')}?`,
                    onConfirm: () => {
                         updateReservation({
                            ...reservation,
                            roomId: targetRoom.id,
                            startDate: newStartDate.toISOString().split('T')[0],
                            endDate: newEndDate.toISOString().split('T')[0],
                        });
                    }
                });
            }
        }
        setDraggingInfo(null);
        setDropTarget(null);
    }, [draggingInfo, dropTarget, guests, openModal, rooms, updateReservation, viewStartDate]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!draggingInfo || !scrollContainerRef.current) return;

        const { timelineGridRect, dayWidth } = draggingInfo;
        const y = event.clientY - timelineGridRect.top + scrollContainerRef.current.scrollTop;
        const x = event.clientX - timelineGridRect.left + scrollContainerRef.current.scrollLeft;

        const roomIndex = Math.floor(y / rowHeight);
        const dayIndex = Math.floor(x / dayWidth);

        if (roomIndex >= 0 && roomIndex < rooms.length && dayIndex >= 0 && dayIndex < viewDays) {
            setDropTarget({ roomIndex, dayIndex });
        } else {
            setDropTarget(null);
        }
    }, [draggingInfo, rooms.length, viewDays, rowHeight]);
    
    useEffect(() => {
        if (draggingInfo) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingInfo, handleMouseMove, handleMouseUp]);


    const handleReservationMouseDown = (event: React.MouseEvent, reservation: Reservation) => {
        if (!event.shiftKey) return;
        event.preventDefault();

        if (timelineGridRef.current) {
            const timelineGridRect = timelineGridRef.current.getBoundingClientRect();
            const duration = dateDiffInDays(new Date(reservation.startDate), new Date(reservation.endDate));

            setDraggingInfo({
                reservation,
                duration,
                timelineGridRect,
                rowHeight,
                dayWidth,
            });
        }
    };


    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-indigo-700 to-purple-600 text-white rounded-t-lg">
                <h1 className="text-2xl font-bold">Calendar</h1>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <button onClick={() => setViewStartDate(addDays(viewStartDate, -viewDays))} className="p-2 rounded-full hover:bg-white/20 transition-colors"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <span className="text-lg font-semibold w-48 text-center">{dateRangeString}</span>
                    <button onClick={() => setViewStartDate(addDays(viewStartDate, viewDays))} className="p-2 rounded-full hover:bg-white/20 transition-colors"><ChevronRightIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setViewStartDate(new Date(new Date().setHours(0,0,0,0)))} className="px-4 py-2 text-sm font-semibold bg-white/10 border border-white/20 rounded-md hover:bg-white/20 backdrop-blur-sm transition-colors">Hoje</button>
                     <div className="relative">
                        <select 
                            value={viewDays}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setViewDays(parseInt(e.target.value, 10))}
                            className="appearance-none cursor-pointer px-4 py-2 text-sm font-semibold bg-white/10 border border-white/20 rounded-md hover:bg-white/20 backdrop-blur-sm transition-colors pr-8"
                        >
                            <option value="7">7 dias</option>
                            <option value="14">14 dias</option>
                            <option value="30">30 dias</option>
                        </select>
                        <ChevronDownIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                    </div>
                </div>
            </header>

            {/* Grid */}
            <div ref={scrollContainerRef} className="flex-grow overflow-auto">
                <div className="grid relative" style={{ gridTemplateColumns: `180px 1fr` }}>
                     {/* Sticky Column with Header and Rooms */}
                    <div className="sticky left-0 z-20">
                        <div className="sticky top-0 p-2 font-semibold text-left bg-gray-150 border-b border-r border-gray-200 h-16 flex items-center">Quartos</div>
                        {rooms.map((room) => {
                            const roomBgClass = getRoomStatusRowClass(room.status);
                            return (
                                <div key={room.id} className={`p-3 flex flex-col justify-center border-r border-b border-gray-200 transition-colors duration-300 ${roomBgClass}`} style={{ height: `${rowHeight}px` }}>
                                    <div className="font-bold text-lg">{room.name} <span className="text-sm font-normal text-gray-500">{room.type}</span></div>
                                    <div className="flex items-center mt-1">
                                        <select 
                                            value={room.status}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateRoomStatus(room.id, e.target.value as RoomStatus)}
                                            className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                        >
                                            <option>Limpo</option>
                                            <option>Sujo</option>
                                            <option>Manutenção</option>
                                        </select>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    
                    {/* Scrollable Timeline */}
                    <div className="overflow-x-visible">
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${viewDays}, minmax(100px, 1fr))` }}>
                           {/* Day Headers */}
                            {days.map((day: Date) => {
                                const isToday = day.getTime() === today.getTime();
                                return (
                                    <div key={day.toISOString()} className="sticky top-0 z-10 p-2 text-center bg-gray-50 border-b border-r border-gray-200 h-16 flex flex-col justify-center">
                                        <div className="text-xs font-semibold text-gray-500">{day.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}</div>
                                        <div className={`font-bold text-lg ${isToday ? 'text-indigo-600' : ''}`}>{day.getDate()}</div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        <div ref={timelineGridRef} className="relative grid" style={{ height: `${rooms.length * rowHeight}px`, gridTemplateRows: `repeat(${rooms.length}, ${rowHeight}px)`, gridTemplateColumns: `repeat(${viewDays}, minmax(100px, 1fr))`}}>
                            {/* Background grid cells */}
                            {rooms.map((room, rowIndex) => {
                                 return days.map((day: Date, dayIndex: number) => {
                                    const isPast = day < today;
                                    const canCreateReservation = currentUser.role !== 'limpeza';
                                    const cellBgClass = isPast ? 'bg-slate-50' : getRoomStatusRowClass(room.status);
                                    return (
                                        <div 
                                            key={`${room.id}-${day.toISOString()}`}
                                            className={`h-full border-r border-b border-gray-200 transition-colors duration-300 ${cellBgClass} ${!isPast && canCreateReservation ? 'cursor-pointer hover:bg-black/5' : ''}`}
                                            style={{gridRow: `${rowIndex + 1}`, gridColumn: `${dayIndex + 1}`}}
                                            onClick={() => !isPast && canCreateReservation && openModal('reservation', { date: day, roomId: room.id })}
                                        ></div>
                                    )
                                })
                            })}
                           
                           <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {/* Reservations */}
                            {reservations.map(res => {
                                const startDate = new Date(res.startDate + 'T00:00:00Z');
                                const endDate = new Date(res.endDate + 'T00:00:00Z');
                                
                                const startOffset = dateDiffInDays(viewStartDate, startDate);
                                const duration = dateDiffInDays(startDate, endDate);
                                
                                if (duration <= 0 || dayWidth === 0) return null;

                                const roomIndex = rooms.findIndex(r => r.id === res.roomId);
                                if (roomIndex === -1) return null;

                                // Check if reservation is within the current view
                                const endOffset = startOffset + duration;
                                if (endOffset <= 0 || startOffset >= viewDays) return null;

                                const isDragging = draggingInfo?.reservation.id === res.id;
                                const statusColor = getStatusColor(res.status);
                                const gradientClass = getReservationGradient(statusColor);
                                const canDrag = currentUser.role !== 'limpeza';

                                return (
                                    <div key={res.id}
                                        onMouseDown={(e) => canDrag && handleReservationMouseDown(e, res)}
                                        className={`absolute ${gradientClass} flex items-center justify-center text-white font-semibold text-sm shadow-lg hover:shadow-xl mx-px transition-all duration-200 hover:scale-[1.02] pointer-events-auto ${isDragging ? 'opacity-60 cursor-grabbing z-40' : (canDrag ? 'cursor-grab' : 'cursor-default')}`}
                                        style={{
                                            top: `${roomIndex * rowHeight + 8}px`,
                                            left: `${(startOffset + 0.5) * dayWidth}px`,
                                            width: `${duration * dayWidth}px`,
                                            height: `${rowHeight - 16}px`,
                                            borderRadius: '0.5rem',
                                        }}
                                        title={`${getGuestName(res.guestId)} (${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')})`}
                                        onClick={(e) => {
                                            if (e.shiftKey && canDrag) return;
                                            e.stopPropagation();
                                            if (canDrag) {
                                                openModal('reservation', { reservation: res })
                                            }
                                        }}
                                    >
                                       <span className="truncate px-2 pointer-events-none">{getGuestName(res.guestId)}</span>
                                    </div>
                                );
                            })}
                            {/* Drop Placeholder */}
                            {draggingInfo && dropTarget && dayWidth > 0 &&(
                                 <div
                                    className="absolute border-2 border-dashed border-indigo-400 rounded-lg z-30 pointer-events-none"
                                    style={{
                                        top: `${dropTarget.roomIndex * rowHeight + 8}px`,
                                        left: `${(dropTarget.dayIndex + 0.5) * dayWidth}px`,
                                        width: `${draggingInfo.duration * dayWidth}px`,
                                        height: `${rowHeight - 16}px`,
                                        transition: 'all 0.1s ease',
                                    }}
                                />
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
