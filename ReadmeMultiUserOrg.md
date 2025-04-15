# Multi-User Organizer Management in Calendar Admin

## Overview
This document explains the model for user-organizer relationships in the Calendar Admin system and how multiple users can manage organizers.

## Relationship Model

### Basic 1:1 Relationship
The system uses a 1:1 relationship between users and organizers as the foundation:

1. **Organizer Schema**:
   - `linkedUserLogin`: MongoDB ObjectId reference to primary user (required)
   - `firebaseUserId`: Firebase UID of primary user (required)

2. **User Schema**:
   - `regionalOrganizerInfo.organizerId`: MongoDB ObjectId reference to the organizer

This creates a bidirectional link where an organizer has one primary user, and a user can be primary for one organizer.

### Delegation Model for Multiple Users
Rather than creating complex many-to-many relationships, the system uses an organizer-to-organizer delegation model:

1. **Organizer Schema includes**:
   - `delegatedOrganizerIds`: Array of Organizer ObjectIds

2. **How it works**:
   - Organizer A has a primary user (User A)
   - Organizer B has a primary user (User B)
   - Organizer A can delegate management to Organizer B by adding B's ID to `delegatedOrganizerIds`
   - This effectively gives User B access to manage Organizer A

## Benefits of This Approach

1. **Clear Ownership**: Each organizer maintains a clear primary owner
2. **Simplified Access Control**: Permissions are applied at the organizer level
3. **No Orphaned Records**: When a user is deleted, organizers persist with their delegations
4. **Scalable**: Delegation chains can be extended as needed
5. **Reduced Duplication**: Avoids creating temporary/duplicate user accounts

## User Interface Implementation

### For Organizer Management
- Show primary user prominently
- Display a list of delegated organizers with ability to add/remove
- Allow searching for existing organizers to delegate to
- Show clear warning when removing delegations

### For User Management
- Show primary organizer connection
- Show list of organizations the user has delegated access to (via their organizer)
- Provide clear distinction between primary and delegated relationships

## Permissions and Access Control

1. **Primary User**:
   - Full control over their organizer
   - Can add/remove delegations
   - Can update all organizer details

2. **Delegated Users**:
   - Can view and edit basic organizer information
   - Cannot modify delegations (prevent delegation chains)
   - Limited access based on permission settings

## Deletion Behavior

1. **When a User is Deleted**:
   - Organizer remains intact
   - Organizer's primary user references are nullified
   - System administrator must reassign organizer to new primary user

2. **When an Organizer is Deleted**:
   - Remove reference from primary user's `regionalOrganizerInfo.organizerId`
   - Remove from all delegation lists in other organizers

## Technical Implementation
The implementation requires:
1. UI components for managing delegations
2. Backend validation to maintain data integrity
3. Permission checks based on delegation relationships
4. Proper cleanup during deletion operations