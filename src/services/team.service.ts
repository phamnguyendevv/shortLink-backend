import { settingRepository } from '../repositories/setting.repositories'
import { teamRepository } from '../repositories/team.repositories'

const TeamService = {
  getTeam: async (userId: number): Promise<any> => {
    console.log('userId', userId)
    try {
      // Fetch team information from the database
      const team = await teamRepository.findTeamByCreatorId(userId)
      if (!team) {
        throw new Error('Không tìm thấy team')
      }
      return {
        data: team,
        message: 'Lấy thông tin team thành công',
        status: 200
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin team', error)
      throw new Error('Lỗi khi lấy thông tin team')
    }
  },
  updateTeam: async (adminId: number, data: any): Promise<any> => {
    try {
      const { memberId, targetUrl } = data
      console.log('adminId', adminId)
      console.log('memberId', memberId)

      // Find the team by adminId
      const team = await teamRepository.findTeamByCreatorId(adminId)
      if (!team) {
        throw new Error('Không tìm thấy team')
      }

      let updateData: any = {}

      // If memberId is provided, disconnect the member
      if (memberId) {
        const isMemberExist = team.members.some((member: any) => member.id === memberId)
        if (!isMemberExist) {
          throw new Error('Thành viên không tồn tại trong team')
        }
        updateData.members = {
          disconnect: { id: memberId } // Prisma uses `disconnect` to remove relationships
        }
      }

      // If targetUrl is provided, update it for the team and all members
      if (targetUrl) {
        updateData.targetUrl = targetUrl

        // Update targetUrl for all members in the team
        await Promise.all(
          team.members.map(async (member: any) => {
            console.log('member', member)
            await settingRepository.updateMemberTargetUrl(member.id, targetUrl)
          })
        )
      }

      // Update the team
      const updatedTeam = await teamRepository.updateTeam(team.id, updateData)

      if (!updatedTeam) {
        throw new Error('Cập nhật thông tin team thất bại')
      }

      return {
        message: memberId ? 'Xóa thành viên thành công' : 'Cập nhật thông tin team thành công',
        data: updatedTeam,
        status: 200
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin team:', error)
      if (error instanceof Error) {
        throw new Error(error.message || 'Lỗi khi cập nhật thông tin team')
      } else {
        throw new Error('Lỗi khi cập nhật thông tin team')
      }
    }
  },
  getListTeam: async (userId: number): Promise<any> => {
    console.log('userId', userId)
    try {
      // Fetch team information from the database
      const team = await teamRepository.findAllTeam()
      if (!team) {
        throw new Error('Không tìm thấy team')
      }
      return {
        data: team,
        message: 'Lấy thông tin team thành công',
        status: 200
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin team', error)
      throw new Error('Lỗi khi lấy thông tin team')
    }
  }
}

export default TeamService
