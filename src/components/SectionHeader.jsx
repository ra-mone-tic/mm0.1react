function SectionHeader({ title, isToday = false, isTomorrow = false }) {
  return (
    <div className={`day-section-header ${isToday ? 'today' : ''} ${isTomorrow ? 'tomorrow' : ''}`}>
      {title}
    </div>
  );
}

export default SectionHeader;
