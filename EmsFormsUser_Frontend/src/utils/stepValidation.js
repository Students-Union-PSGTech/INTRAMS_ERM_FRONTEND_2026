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
    const contacts = formData.contacts || {};

    const checkStudent = (student, roleName, idx = null) => {
      if (!student) return;
      const prefix = idx !== null ? `${roleName}_${idx}` : roleName;
      const displayRole = idx !== null ? `${roleName} ${idx + 1}` : roleName;
      
      const name = (student.name || '').trim();
      const roll = (student.roll_number || student.rollNo || '').trim();
      const dept = (student.department || student.dept || '').trim();
      const mobile = (student.mobile || student.phone || '').trim();
      // Year is not strictly captured in original validation but it is part of form. If it was not strictly validated before, I will validate it if partially filled.

      const hasAnyField = name || roll || dept || mobile;
      
      const isRequired = (roleName === 'Secretary' && idx === 0) || (roleName === 'Convenor' && idx === 0);

      if (isRequired || hasAnyField) {
        if (!name) errors[`${prefix}_name`] = `${displayRole}: Name is required`;
        if (!roll) errors[`${prefix}_roll`] = `${displayRole}: Roll Number is required`;
        // if (!dept) errors[`${prefix}_dept`] = `${displayRole}: Department is required`;
        // wait, the previous code required dept for Convenor but not Secretary? Let's require it for all students since it's a standard field, but let's check original.
        // Original: Sec didn't validate Dept. Conv did. Let's require it generally if it's there.
        if (roleName === 'Convenor' || dept) {
             if (!dept && isRequired) errors[`${prefix}_dept`] = `${displayRole}: Department is required`;
             else if (!dept) errors[`${prefix}_dept`] = `${displayRole}: Department is required`;
        }

        if (!mobile) errors[`${prefix}_mobile`] = `${displayRole}: Mobile Number is required`;
      }
    };

    const checkFaculty = (faculty) => {
      if (!faculty) return;
      const name = (faculty.name || '').trim();
      const designation = (faculty.designation || '').trim();
      const mobile = (faculty.mobile || faculty.phone || '').trim();
      
      if (!name) errors.faculty_name = 'Faculty Advisor: Name is required';
      if (!designation) errors.faculty_designation = 'Faculty Advisor: Designation is required';
      if (!mobile) errors.faculty_mobile = 'Faculty Advisor: Mobile Number is required';
    };

    const checkJudge = (judge) => {
      if (!judge) return;
      const name = (judge.name || '').trim();
      const designation = (judge.designation || '').trim();
      const mobile = (judge.mobile || judge.phone || '').trim();

      const hasAnyField = name || designation || mobile;

      if (hasAnyField) {
        if (!name) errors.judge_name = 'Judge: Name is required';
        if (!designation) errors.judge_designation = 'Judge: Designation is required';
        if (!mobile) errors.judge_mobile = 'Judge: Mobile Number is required';
      }
    };

    const secs = contacts.secretaries || (contacts.secretary ? [contacts.secretary] : []);
    secs.forEach((s, idx) => checkStudent(s, 'Secretary', idx));

    const convs = contacts.convenors || (contacts.convenor ? [contacts.convenor] : []);
    convs.forEach((c, idx) => checkStudent(c, 'Convenor', idx));

    const vols = contacts.volunteers || [];
    vols.forEach((v, idx) => checkStudent(v, 'Volunteer', idx));

    checkFaculty(contacts.faculty_advisor || contacts.faculty);
    checkJudge(contacts.judge);

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  if (step === 4) {
    // Venue & Schedule (NewDescriptionPage)
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

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  if (step === 5) {
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
