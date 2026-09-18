export const validateStep = (step, formData = {}) => {
  const errors = {};

  if (step === 1) {
    // Instructions step (always valid)
    return { isValid: true, errors: {} };
  }

  if (step === 2) {
    // Basic Info & Rounds
    if (!formData.name?.trim()) errors.name = 'Event Name is required';
    if (!formData.tagline?.trim()) errors.tagline = 'Tagline is required';
    if (!formData.about?.trim()) errors.about = 'About Event is required';

    if (!Array.isArray(formData.rounds) || formData.rounds.length === 0) {
      errors.rounds = 'At least 1 event round is required';
    } else {
      formData.rounds.forEach((round, idx) => {
        if (!round.name?.trim()) {
          errors[`round_${idx}_name`] = `Round ${idx + 1}: Name is required`;
        }
        if (!round.description?.trim()) {
          errors[`round_${idx}_desc`] = `Round ${idx + 1}: Description is required`;
        }
      });
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  if (step === 3) {
    // Personnel Details (Secretary, Convenor, Faculty Advisor)
    const contacts = formData.contacts || {};

    // Secretary Validation
    const sec = contacts.secretary || (Array.isArray(contacts.secretaries) ? contacts.secretaries[0] : null) || {};
    const secName = sec.name || formData.secretaryName || '';
    const secRoll = sec.roll_number || sec.rollNo || formData.secretaryRollNo || '';
    const secMobile = sec.mobile || sec.phone || formData.secretaryPhone || '';

    if (!secName.trim()) errors.secretary_name = 'Secretary Name is required';
    if (!secRoll.trim()) errors.secretary_roll = 'Secretary Roll Number is required';
    if (!secMobile.trim()) errors.secretary_mobile = 'Secretary Mobile Number is required';

    // Convenor Validation
    const conv = (Array.isArray(contacts.convenors) ? contacts.convenors[0] : contacts.convenor) || {};
    const convName = conv.name || formData.convenorName || '';
    const convRoll = conv.roll_number || conv.rollNo || formData.convenorRollNo || '';
    const convDept = conv.department || conv.dept || formData.convenorDept || '';
    const convMobile = conv.mobile || conv.phone || formData.convenorPhone || '';

    if (!convName.trim()) errors.convenor_name = 'Convenor Name is required';
    if (!convRoll.trim()) errors.convenor_roll = 'Convenor Roll Number is required';
    if (!convDept.trim()) errors.convenor_dept = 'Convenor Department is required';
    if (!convMobile.trim()) errors.convenor_mobile = 'Convenor Mobile Number is required';

    // Faculty Advisor Validation
    const fac = contacts.faculty_advisor || contacts.faculty || {};
    const facName = fac.name || formData.facultyName || '';
    const facDept = fac.department || fac.designation || formData.facultyDepartment || '';
    const facMobile = fac.mobile || fac.phone || formData.facultyPhone || '';

    if (!facName.trim()) errors.faculty_name = 'Faculty Advisor Name is required';
    if (!facDept.trim()) errors.faculty_dept = 'Faculty Advisor Department/Designation is required';
    if (!facMobile.trim()) errors.faculty_mobile = 'Faculty Advisor Mobile Number is required';

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  if (step === 4) {
    // Venue & Schedule (NewDescriptionPage) & Logistics Items (ItemsPage)
    const form = formData.form || {};
    const duration = form.duration || formData.duration || '';
    const halls = form.preferred_halls || formData.preferred_halls || formData.venue || '';
    const isTwoDay = Boolean(form.is_two_day);

    if (isTwoDay) {
      const day1Slot = form.day1_slot || '';
      const day2Slot = form.day2_slot || '';
      if (!day1Slot.trim()) errors.day1_slot = 'Day 1 time slot is required';
      if (!day2Slot.trim()) errors.day2_slot = 'Day 2 time slot is required';
    } else {
      const day = form.day || formData.day || '';
      const slot = form.slot || formData.slot || '';
      if (!day.trim()) errors.day = 'Event Day selection is required';
      if (!slot.trim()) errors.slot = 'Time Slot is required';
    }

    if (!duration.trim()) errors.duration = 'Event Duration is required';
    if (!halls.trim()) errors.preferred_halls = 'Preferred Halls / Venue is required';

    // Logistics Items Validation
    if (Array.isArray(formData.items) && formData.items.length > 0) {
      const itemNames = new Set();
      formData.items.forEach((item, idx) => {
        const iName = (item.item_name || item.name || item.itemName || '').trim();
        if (!iName) {
          errors[`item_${idx}_name`] = `Item ${idx + 1}: Select an Item Name`;
        } else {
          if (itemNames.has(iName.toLowerCase())) {
            errors[`item_${idx}_duplicate`] = `Item ${idx + 1}: Duplicate item selected`;
          }
          itemNames.add(iName.toLowerCase());
        }
        if (item.quantity === undefined || item.quantity === null || Number(item.quantity) <= 0) {
          errors[`item_${idx}_quantity`] = `Item ${idx + 1}: Quantity must be greater than 0`;
        }
      });
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  return { isValid: true, errors: {} };
};
