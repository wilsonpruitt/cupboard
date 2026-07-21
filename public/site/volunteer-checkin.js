/* ============================================
   St. Mark Legacy Food Pantry — Volunteer Self Check-In
   Name search/typeahead, first-time form, check-in submission
   ============================================ */

(function () {
  'use strict';

  var PANTRY_DAYS = { 1: 'Monday', 5: 'Friday', 6: 'Saturday' };
  var SEARCH_DEBOUNCE_MS = 250;

  var searchInput = document.getElementById('search-input');
  var matchesEl = document.getElementById('matches');
  var notMeLink = document.getElementById('not-me-link');
  var newVolunteerForm = document.getElementById('new-volunteer-form');
  var statusMsg = document.getElementById('status-msg');
  var checkinFlow = document.getElementById('checkin-flow');
  var confirmation = document.getElementById('confirmation');
  var confirmedName = document.getElementById('confirmed-name');
  var checkInAnotherBtn = document.getElementById('check-in-another');
  var notPantryDay = document.getElementById('not-pantry-day');

  var debounceTimer = null;
  var submitting = false;

  function todayInfo() {
    var d = new Date();
    var dow = d.getDay();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return {
      date: y + '-' + m + '-' + day,
      dayOfWeek: PANTRY_DAYS[dow] || null,
    };
  }

  function setStatus(msg, isError) {
    statusMsg.textContent = msg || '';
    statusMsg.classList.toggle('error', !!isError);
  }

  function renderMatches(matches) {
    matchesEl.innerHTML = '';
    matches.forEach(function (m) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'match-row';
      btn.textContent = m.firstName + ' ' + m.lastName;
      btn.addEventListener('click', function () {
        checkIn({ volunteerId: m.id, displayName: btn.textContent });
      });
      matchesEl.appendChild(btn);
    });
  }

  function handleSearchInput() {
    var q = searchInput.value.trim();
    clearTimeout(debounceTimer);
    if (q.length < 2) {
      matchesEl.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(function () {
      fetch('/api/public/volunteer-checkin?q=' + encodeURIComponent(q))
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.ok) renderMatches(data.matches || []);
        })
        .catch(function () {
          // Silent — typeahead is a nicety, not required to check in
        });
    }, SEARCH_DEBOUNCE_MS);
  }

  function toggleNewVolunteerForm() {
    var showing = newVolunteerForm.style.display === 'block';
    newVolunteerForm.style.display = showing ? 'none' : 'block';
    notMeLink.textContent = showing ? 'First time volunteering here?' : 'Cancel';
  }

  function handleNewVolunteerSubmit(e) {
    e.preventDefault();
    var hp = document.getElementById('website');
    if (hp && hp.value) return;

    var firstName = document.getElementById('firstName').value.trim();
    var lastName = document.getElementById('lastName').value.trim();

    if (!firstName || !lastName) {
      setStatus('Please enter your first and last name.', true);
      return;
    }

    checkIn({ firstName: firstName, lastName: lastName, displayName: firstName + ' ' + lastName });
  }

  function checkIn(who) {
    if (submitting) return;
    submitting = true;
    setStatus('Checking in...');

    var today = todayInfo();
    var payload = {
      date: today.date,
      dayOfWeek: today.dayOfWeek,
    };
    if (who.volunteerId) {
      payload.volunteerId = who.volunteerId;
    } else {
      payload.firstName = who.firstName;
      payload.lastName = who.lastName;
    }

    fetch('/api/public/volunteer-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        submitting = false;
        if (data.ok) {
          showConfirmation(who.displayName);
        } else {
          setStatus(data.error || 'Something went wrong. Please try again.', true);
        }
      })
      .catch(function () {
        submitting = false;
        setStatus('Network error. Please check your connection and try again.', true);
      });
  }

  function showConfirmation(name) {
    checkinFlow.style.display = 'none';
    confirmedName.textContent = name;
    confirmation.style.display = 'block';
  }

  function resetFlow() {
    confirmation.style.display = 'none';
    checkinFlow.style.display = 'block';
    searchInput.value = '';
    matchesEl.innerHTML = '';
    newVolunteerForm.style.display = 'none';
    newVolunteerForm.reset();
    notMeLink.textContent = 'First time volunteering here?';
    setStatus('');
    searchInput.focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var today = todayInfo();
    if (!today.dayOfWeek) {
      checkinFlow.style.display = 'none';
      notPantryDay.style.display = 'block';
      return;
    }

    searchInput.addEventListener('input', handleSearchInput);
    notMeLink.addEventListener('click', toggleNewVolunteerForm);
    newVolunteerForm.addEventListener('submit', handleNewVolunteerSubmit);
    checkInAnotherBtn.addEventListener('click', resetFlow);
  });
})();
