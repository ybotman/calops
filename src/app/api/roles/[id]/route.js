import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getRolesModel } from '@/lib/models';

// GET role by ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const Roles = await getRolesModel();
    
    const role = await Roles.findById(id);
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(role);
  } catch (error) {
    console.error(`Error fetching role ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

// PATCH update role by ID
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const Roles = await getRolesModel();
    const updates = await request.json();
    
    const role = await Roles.findById(id);
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    // Update fields
    if (updates.roleName) role.roleName = updates.roleName;
    if (updates.roleNameCode) role.roleNameCode = updates.roleNameCode;
    if (updates.description) role.description = updates.description;
    if (updates.permissions) role.permissions = updates.permissions;
    
    role.updatedAt = new Date();
    await role.save();
    
    return NextResponse.json(role);
  } catch (error) {
    console.error(`Error updating role ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE role by ID
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const Roles = await getRolesModel();
    
    const role = await Roles.findById(id);
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    await Roles.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error(`Error deleting role ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}