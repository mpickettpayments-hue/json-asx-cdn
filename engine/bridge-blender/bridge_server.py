# engine/bridge-blender/bridge_server.py
# Run inside Blender: blender --python engine/bridge-blender/bridge_server.py
import bpy, json, asyncio, websockets, math
from mathutils import Vector

PORT = 8765

async def handle(ws, path):
    async for msg in ws:
        req = json.loads(msg)
        cmd = req.get('cmd'); args = req.get('args', {})
        if cmd == 'ping':
            await ws.send(json.dumps({'ok': True, 'pong': True}))

        elif cmd == 'new_model':
            name = args.get('name','XJSON_Cube')
            mesh = bpy.data.meshes.new(name)
            obj = bpy.data.objects.new(name, mesh)
            bpy.context.collection.objects.link(obj)
            bpy.context.view_layer.objects.active = obj
            bm = bpy.data.meshes.new_from_object(obj.evaluated_get(bpy.context.evaluated_depsgraph_get()))
            obj.data = bm
            await ws.send(json.dumps({'ok':True,'name':name}))

        elif cmd == 'make_cube':
            size = float(args.get('size',1.0))
            bpy.ops.mesh.primitive_cube_add(size=size, location=(0,0,size/2))
            await ws.send(json.dumps({'ok':True,'made':'cube','size':size}))

        elif cmd == 'export_glb':
            path = args.get('path','/tmp/xjson_model.glb')
            bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=False)
            await ws.send(json.dumps({'ok':True,'path':path}))

        elif cmd == 'render_preview':
            path = args.get('path','/tmp/xjson_preview.png')
            bpy.context.scene.render.filepath = path
            bpy.ops.render.render(write_still=True)
            await ws.send(json.dumps({'ok':True,'path':path}))

        else:
            await ws.send(json.dumps({'ok':False,'error':'unknown command'}))

async def main():
    async with websockets.serve(handle, '127.0.0.1', PORT):
        print(f'XJSON Blender Bridge listening on ws://127.0.0.1:{PORT}')
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
